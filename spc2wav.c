#include <snes_spc/spc.h>
#include <id666/id666.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <errno.h>

#define SAMPLE_RATE 32000
#define CHANNELS 2
#define DEFAULT_AMP 0x180

#define str_equals(s1,s2) (strcmp(s1,s2) == 0)
#define str_istarts(s1,s2) (strncasecmp(s1,s2,strlen(s2)) == 0)

static char time_buf[256];

typedef struct str_buffer {
    uint8_t *x;
    uint32_t a;
    uint32_t len;
} str_buffer;

static str_buffer id3_buffer;

static const char *frame_to_time(uint64_t frames);
static unsigned int scan_uint(const char *s);
static void pack_int16le(uint8_t *d, int16_t n);
static void pack_uint16le(uint8_t *d, uint16_t n);
static void pack_uint32le(uint8_t *d, uint32_t n);
static void fade_frames(int16_t *d, unsigned int framesRem, unsigned int fadeFrames, unsigned int frameCount);
static void pack_frames(uint8_t *d, int16_t *s, unsigned int frameCount);
static int write_wav_header(FILE *f, uint64_t totalFrames, str_buffer *id3);
static int write_wav_footer(FILE *f, str_buffer *id3);
static int write_frames(FILE *f, uint8_t *d, unsigned int frameCount);
static uint8_t *slurp(char *filename, uint32_t *size);

static void id3_init(str_buffer *s);
static int id3_add_text(str_buffer *s, const char *frame, const char *data, size_t datalen);
static int id3_add_comment(str_buffer *s,const char *data, size_t datalen);
static int id3_add_private(str_buffer *s, const char *description, const char *data, size_t datalen);

int usage(const char *self, int e) {
    fprintf(stderr,"Usage: %s --amp (amplitude) --use-amp-tag --id3 /path/to/file\n",self);
    fprintf(stderr,"  \"Accurate\" SNES amplitude = 256\n");
    fprintf(stderr,"  Default = 384\n");
    return e;
}

int main(int argc, char *argv[]) {
    SNES_SPC *spc;
    SPC_Filter *filter;
    id666 id6;

    uint8_t *rom;
    uint32_t romSize;
    int16_t *buf; /* audio samples, native machine format */
    uint8_t *pac; /* audio samples, little-endian format */
    int fc; /* current # of frames to decode */
    FILE *out;
    uint64_t totalFrames;
    uint64_t fadeFrames;
    unsigned int outFileLen;
    char *outFile;
    const char *s;
    const char *self;
    char *c;
    uint32_t totalSecs;
    uint32_t fadeSecs;

    unsigned int amp;
    int useAmpTag;
    int embedId3;
    char yearTmp[5];

    rom = NULL;
    buf = NULL;
    pac = NULL;
    romSize = 0;
    totalSecs = 0;
    fadeSecs = 0;
    useAmpTag = 0;
    embedId3 = 0;
    amp = DEFAULT_AMP;
    self = *argv++;
    argc--;

    while(argc > 0) {
        if(str_equals(*argv,"--")) {
            argv++;
            argc--;
            break;
        }
        else if(str_istarts(*argv,"--amp")) {
            c = strchr(*argv,'=');
            if(c != NULL) {
                s = &c[1];
            } else {
                argv++;
                argc--;
                s = *argv;
            }
            amp = scan_uint(s);
            if(amp == 0) {
                return usage(self,1);
            }
            argv++;
            argc--;
        }
        else if(str_istarts(*argv,"--use-amp-tag")) {
            useAmpTag = 1;
            argv++;
            argc--;
        }
        else if(str_istarts(*argv,"--id3")) {
            embedId3 = 1;
            argv++;
            argc--;
        }
        else if(str_istarts(*argv,"--fade")) {
            c = strchr(*argv,'=');
            if(c != NULL) {
                s = &c[1];
            } else {
                argv++;
                argc--;
                s = *argv;
            }
            fadeSecs = scan_uint(s);
            if(fadeSecs == 0) {
                return usage(self,1);
            }
            argv++;
            argc--;
        }
        else if(str_istarts(*argv,"--length")) {
            c = strchr(*argv,'=');
            if(c != NULL) {
                s = &c[1];
            } else {
                argv++;
                argc--;
                s = *argv;
            }
            totalSecs = scan_uint(s);
            if(totalSecs == 0) {
                return usage(self,1);
            }
            argv++;
            argc--;
        }
        else {
            break;
        }
    }

    if(argc < 1) {
        return usage(self,1);
    }

    if(argc > 1) {
        outFile = strdup(argv[1]);
    } else {
        outFile = strdup(argv[0]);
        c = strrchr(outFile,'.');
        *c = 0;
        outFileLen = snprintf(NULL,0,"%s%s",outFile,".wav");
        free(outFile);
        outFile = (char *)malloc(outFileLen + 1);
        strcpy(outFile,argv[0]);
        c = strrchr(outFile,'.');
        *c = 0;
        strcat(outFile,".wav");
    }

    rom = slurp(argv[0],&romSize);
    if(rom == NULL) return 1;

    if(id666_parse(&id6,rom,romSize)) {
        return 1;
    }
    if(useAmpTag) amp = (id6.amp / 0x100);

    spc = spc_new();
    filter = spc_filter_new();

    if(spc_load_spc(spc,rom,romSize) != NULL) {
        return 1;
    }
    free(rom);

    buf = (int16_t *)malloc(sizeof(int16_t) * 2 * 4096);
    pac = (uint8_t *)malloc(sizeof(int16_t) * 2 * 4096);

    if(totalSecs == 0) {
        totalFrames = ((uint64_t)id6.total_len) / 2;
    } else {
        totalFrames = ((uint64_t)totalSecs) * 32000;
    }

    if(fadeSecs == 0) {
        fadeFrames = ((uint64_t)id6.fade) / 2;
    } else {
        fadeFrames = ((uint64_t)fadeSecs) * 32000;
    }

    id3_buffer.x = (uint8_t *)malloc(sizeof(uint8_t) * 4096);
    if(id3_buffer.x == NULL) {
        return 1;
    }
    id3_buffer.len = 0;
    id3_buffer.a = 4096;

    id3_init(&id3_buffer);

    if(embedId3) {
        if(strnlen(id6.song,256)) {
            if(id3_add_text(&id3_buffer,"TIT2",id6.song,strnlen(id6.song,256)) == -1) return 1;
        }
        if(strnlen(id6.game,256)) {
            if(id3_add_text(&id3_buffer,"TALB",id6.game,strnlen(id6.game,256)) == -1) return 1;
        }
        if(strnlen(id6.dumper,256)) {
            if(id3_add_private(&id3_buffer,"spc_dumper",id6.dumper,strnlen(id6.game,256)) == -1) return 1;
        }
        if(strnlen(id6.comment,256)) {
            if(id3_add_comment(&id3_buffer,id6.comment,strnlen(id6.comment,256)) == -1) return 1;
        }
        if(strnlen(id6.artist,256)) {
            if(id3_add_text(&id3_buffer,"TPE1",id6.artist,strnlen(id6.artist,256)) == -1) return 1;
        }
        if(strnlen(id6.publisher,256)) {
            if(id3_add_text(&id3_buffer,"TPUB",id6.publisher,strnlen(id6.publisher,256)) == -1) return 1;
        }
        if(id6.year != -1) {
            snprintf(yearTmp,5,"%d",id6.year);
            if(id3_add_text(&id3_buffer,"TDRC",yearTmp,strlen(yearTmp)) == -1) return 1;
        }
    }

    out = fopen(outFile,"wb");
    if(out == NULL) {
        fprintf(stderr,"Error opening %s\n",outFile);
        return 1;
    }
    spc_clear_echo(spc);
    spc_filter_clear(filter);
    spc_filter_set_gain(filter,amp);

    fprintf(stderr,"Decoding %s to %s\n",argv[0],outFile);
    fprintf(stderr,"Applying gain: 0x%04x (%s)\n",amp, amp == DEFAULT_AMP ? "default" : "custom");
    fprintf(stderr,"Length: %s\n",frame_to_time(totalFrames));
    fprintf(stderr,"  Play length: %s\n",frame_to_time(totalFrames - fadeFrames));
    fprintf(stderr,"  Fade length: %s\n",frame_to_time(fadeFrames));
    fprintf(stderr,"Title: %s\n",id6.song);
    fprintf(stderr,"Game: %s\n",id6.game);
    fprintf(stderr,"Artist: %s\n",id6.artist);
    fprintf(stderr,"Dumper: %s\n",id6.dumper);
    fprintf(stderr,"Comment: %s\n",id6.comment);
    fprintf(stderr,"Publisher: %s\n",id6.publisher);
    fprintf(stderr,"Year: %d\n",id6.year);
    fprintf(stderr,"Amp (from SPC): %f\n",(float)id6.amp / 65536.0f);

    write_wav_header(out,totalFrames,&id3_buffer);
    while(totalFrames) {
        fc = totalFrames < 4096 ? totalFrames : 4096;
        spc_play(spc,fc * 2,buf);
        spc_filter_run(filter,buf,fc*2);
        fade_frames(buf,totalFrames,fadeFrames,fc);
        pack_frames(pac,buf,fc);
        write_frames(out,pac,fc);
        totalFrames -= fc;
    }
    write_wav_footer(out,&id3_buffer);
    fclose(out);

    spc_delete(spc);
    spc_filter_delete(filter);

    free(buf);
    free(pac);
    free(outFile);
    return 0;
}

static uint8_t *slurp(char *filename, uint32_t *size) {
    uint8_t *buf;
    FILE *f = fopen(filename,"rb");
    if(f == NULL) {
        fprintf(stderr,"Error opening %s: %s\n",
          filename,
          strerror(errno));
        return NULL;
    }
    fseek(f,0,SEEK_END);
    *size = ftell(f);
    fseek(f,0,SEEK_SET);

    buf = (uint8_t *)malloc(*size);
    if(buf == NULL) {
        fprintf(stderr,"out of memory\n");
        return NULL;
    }
    if(fread(buf,1,*size,f) != *size) {
        fprintf(stderr,"error reading file\n");
        free(buf);
        return NULL;
    }
    return buf;
}

static void pack_int16le(uint8_t *d, int16_t n) {
    d[0] = (uint8_t)(n      );
    d[1] = (uint8_t)(n >> 8 );
}

static void pack_uint16le(uint8_t *d, uint16_t n) {
    d[0] = (uint8_t)(n      );
    d[1] = (uint8_t)(n >> 8 );
}

static void pack_uint32le(uint8_t *d, uint32_t n) {
    d[0] = (uint8_t)(n      );
    d[1] = (uint8_t)(n >> 8 );
    d[2] = (uint8_t)(n >> 16);
    d[3] = (uint8_t)(n >> 24);
}

static int write_wav_footer(FILE *f, str_buffer *id3) {
    uint8_t tmp[4];

    if(id3->len == 10) return 1;

    if(fwrite("ID3 ",1,4,f) != 4) return 0;
    pack_uint32le(tmp,id3->len);
    if(fwrite(tmp,1,4,f) != 4) return 0;
    if(fwrite(id3->x,1,id3->len,f) != id3->len) return 0;
    return 1;
}

static int write_wav_header(FILE *f, uint64_t totalFrames, str_buffer *id3) {
    unsigned int dataSize = totalFrames * sizeof(int16_t) * CHANNELS;
    unsigned int id3Size = 0;
    uint8_t tmp[4];

    if(id3->len > 10) id3Size = id3->len + 8;

    if(fwrite("RIFF",1,4,f) != 4) return 0;
    pack_uint32le(tmp,dataSize + 44 - 8 + id3Size);
    if(fwrite(tmp,1,4,f) != 4) return 0;

    if(fwrite("WAVE",1,4,f) != 4) return 0;
    if(fwrite("fmt ",1,4,f) != 4) return 0;

    pack_uint32le(tmp,16); /*fmtSize */
    if(fwrite(tmp,1,4,f) != 4) return 0;

    pack_uint16le(tmp,1); /* audioFormat */
    if(fwrite(tmp,1,2,f) != 2) return 0;

    pack_uint16le(tmp,CHANNELS); /* numChannels */
    if(fwrite(tmp,1,2,f) != 2) return 0;

    pack_uint32le(tmp,SAMPLE_RATE);
    if(fwrite(tmp,1,4,f) != 4) return 0;

    pack_uint32le(tmp,SAMPLE_RATE * CHANNELS * sizeof(int16_t));
    if(fwrite(tmp,1,4,f) != 4) return 0;

    pack_uint16le(tmp,CHANNELS * sizeof(int16_t));
    if(fwrite(tmp,1,2,f) != 2) return 0;

    pack_uint16le(tmp,sizeof(int16_t) * 8);
    if(fwrite(tmp,1,2,f) != 2) return 0;

    if(fwrite("data",1,4,f) != 4) return 0;

    pack_uint32le(tmp,dataSize);
    if(fwrite(tmp,1,4,f) != 4) return 0;

    return 1;
}

static void
fade_frames(int16_t *data, unsigned int framesRem, unsigned int framesFade, unsigned int frameCount) {
    unsigned int i = 0;
    unsigned int f = framesFade;
    double fade;

    if(framesRem - frameCount > framesFade) return;
    if(framesRem > framesFade) {
        i = framesRem - framesFade;
        f += i;
    } else {
        f = framesRem;
    }

    while(i<frameCount) {
        fade = (double)(f-i) / (double)framesFade;
        data[(i*2)+0] *= fade;
        data[(i*2)+1] *= fade;
        i++;
    }

    return;
}

static void pack_frames(uint8_t *d, int16_t *s, unsigned int frameCount) {
    unsigned int i = 0;
    while(i<frameCount) {
        pack_int16le(&d[0],s[(i*2)+0]);
#if CHANNELS == 2
        pack_int16le(&d[sizeof(int16_t)],s[(i*2)+1]);
#endif
        i++;
        d += (sizeof(int16_t) * CHANNELS);
    }
}

static int write_frames(FILE *f, uint8_t *d, unsigned int frameCount) {
    return fwrite(d,sizeof(int16_t) * CHANNELS,frameCount,f) == frameCount;
}

unsigned int scan_uint(const char *str) {
    const char *s = str;
    unsigned int num = 0;
    while(*s) {
        if(*s < 48 || *s > 57) break;
        num *= 10;
        num += (*s - 48);
        s++;
    }

    return num;
}

static const char *frame_to_time(uint64_t frames) {
    unsigned int mill;
    unsigned int sec;
    unsigned int min;
    time_buf[0] = 0;
    frames /= 32;
    mill = frames % 1000;
    frames /= 1000;
    sec = frames % 60;
    frames /= 60;
    min = frames;

    sprintf(time_buf,"%02d:%02d.%03d",min,sec,mill);
    return time_buf;
}

static void pack_uint32_syncsafe(uint8_t *output, uint32_t val) {
    output[0] = (uint8_t)((val & 0x0FE00000) >> 21);
    output[1] = (uint8_t)((val & 0x001FC000) >> 14);
    output[2] = (uint8_t)((val & 0x00003F80) >> 7);
    output[3] = (uint8_t)((val & 0x0000007F));
}

static void id3_update_len(str_buffer *s) {
    pack_uint32_syncsafe(&s->x[6],s->len - 10);
}

static void id3_init(str_buffer *s) {
    s->len = 10;

    s->x[0] = 'I';
    s->x[1] = 'D';
    s->x[2] = '3';
    s->x[3] = 0x04;
    s->x[4] = 0x00;
    s->x[5] = 0x00;

    id3_update_len(s);
}

static int id3_add_text(str_buffer *s, const char *frame, const char *data, size_t datalen) {
    uint8_t *t;

    while(s->len + 10 + (1 + datalen + 1) > s->a) {
        t = realloc(s->x, s->a + 512);
        if(t == NULL) {
            return -1;
        }
        s->x = t;
        s->a += 512;
    }

    memcpy(&s->x[s->len],frame,4);
    s->len += 4;

    pack_uint32_syncsafe(&s->x[s->len],(1 + datalen + 1));
    s->len += 4;

    s->x[s->len++] = 0x00;
    s->x[s->len++] = 0x00;
    s->x[s->len++] = 0x03;

    memcpy(&s->x[s->len], data, datalen);
    s->len += datalen;
    s->x[s->len++] = 0x00;

    id3_update_len(s);

    return 0;
}

static int id3_add_comment(str_buffer *s, const char *data, size_t datalen) {
    uint8_t *t;

    while(s->len + 10 + (1 + 3 + datalen + 1 + 1) > s->a) {
        t = realloc(s->x, s->a + 512);
        if(t == NULL) {
            return -1;
        }
        s->x = t;
        s->a += 512;
    }

    s->x[s->len++] = 'C';
    s->x[s->len++] = 'O';
    s->x[s->len++] = 'M';
    s->x[s->len++] = 'M';

    pack_uint32_syncsafe(&s->x[s->len],(1 + 3 + datalen + 1 + 1));
    s->len += 4;

    s->x[s->len++] = 0x00; /* flags */
    s->x[s->len++] = 0x00; /* flags */
    s->x[s->len++] = 0x03; /* encoding */

    s->x[s->len++] = 'e';
    s->x[s->len++] = 'n';
    s->x[s->len++] = 'g';
    s->x[s->len++] = 0x00; /* short content descrip */

    memcpy(&s->x[s->len], data, datalen);
    s->len += datalen;
    s->x[s->len++] = 0x00;

    id3_update_len(s);

    return 0;
}

static int id3_add_private(str_buffer *s, const char *description, const char *data, size_t datalen) {
    uint8_t *t;

    while(s->len + 10 + (1 + strlen(description) + 1 + datalen + 1) > s->a) {
        t = realloc(s->x, s->a + 512);
        if(t == NULL) {
            return -1;
        }
        s->x = t;
        s->a += 512;
    }

    s->x[s->len++] = 'T';
    s->x[s->len++] = 'X';
    s->x[s->len++] = 'X';
    s->x[s->len++] = 'X';

    pack_uint32_syncsafe(&s->x[s->len],(1 + strlen(description) + 1 + datalen + 1));
    s->len += 4;

    s->x[s->len++] = 0x00; /* flags */
    s->x[s->len++] = 0x00; /* flags */
    s->x[s->len++] = 0x03; /* encoding */

    memcpy(&s->x[s->len], description, strlen(description));
    s->len += strlen(description);
    s->x[s->len++] = 0x00; /* short content descrip */

    memcpy(&s->x[s->len], data, datalen);
    s->len += datalen;
    s->x[s->len++] = 0x00;

    id3_update_len(s);

    return 0;
}