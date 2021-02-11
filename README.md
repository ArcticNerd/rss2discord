[![Docker Build Status](https://img.shields.io/docker/cloud/build/tg44/rss2discord?style=flat-square)](https://hub.docker.com/r/tg44/rss2discord)

# Rss2Discord

A simple service which consumes rss feeds, filter them to keywords, and post the interesting ones to discord.

## Config syntax

The app works with one `conf.json` which looks like this;
```
{
    "urls": [
        "https://www.reddit.com/.rss"
    ],
    "interestingWords": [],
    "blacklistedWords": []
}
```

## Running the app

### Local install / dev
You need node 12, start with `npm i` and then `node app.js`.
For setting the discord server url you need to `export DISCORD="mydiscordhookurl"` before the service start.

For enable debugging you can  `export IS_VERBOSE=true`

### Docker and compose
For docker you can run;
```
docker run -e DISCORD="mydiscordhookurl" -v ${PWD}/conf:/home/node/app/conf tg44/rss2discord
```
For docker compose;
```
version: '3.1'
services:
  rss2discord:
    image: tg44/rss2discord
    restart: unless-stopped
    volumes:
      - /otp/rss2discord/:/home/node/app/conf
    environment:
      - DISCORD=mydiscordhookurl
```

In the early config/template writing/testing phase, you can add the `IS_VERBOSE` env var too. 

You can also add `CRON_EXPRESSION` and `CRON_TIMEZONE` if you want to override the default ones (every minute, Eu/Budapest). The cron starts with seconds!
