require('log-timestamp');
const fs = require('fs')
const fsa = fs.promises
const axios = require('axios')
const Parser = require('rss-parser')
const CronJob = require('cron').CronJob;

const isVerbose = process.env.IS_VERBOSE || false
const discordUrl = process.env.DISCORD
const cron = process.env.CRON_EXPRESSION || '0 * * * * *'
const timeZone = process.env.CRON_TIMEZONE || 'Europe/Budapest'

const rawdata = fs.readFileSync('conf/conf.json')
const config = JSON.parse(rawdata)

if(isVerbose) {
  console.info("Transformed config: " + JSON.stringify(config))
  console.info("Discord url: " + discordUrl)
  console.info("Cron expression: " + cron + " in " + timeZone)
}

const job = new CronJob(cron, function() {
  run().then(() => console.info("Successful run!")).catch(err => console.error(err))
}, null, true, timeZone);
job.start();
console.info("App started!")

async function run() {
  const now = Date.now()
  let timeObj = {}
  try{
    timeObj = JSON.parse(await fsa.readFile('conf/times.json'))
  } catch {}
  const lastReadTime = timeObj.lastReadTime || now
  if(isVerbose) {
    console.info("lastReadTime: " + lastReadTime)
  }
  const data = await Promise.all(config.urls.map(url => parseAndFilter(url, lastReadTime, now)))
  await notify(data.flat())
  timeObj.lastReadTime = now
  await fsa.writeFile('conf/times.json',JSON.stringify(timeObj))
}

async function parseAndFilter(url, lastTime, nowTime) {
  if(lastTime === nowTime) return [];
  const parser = new Parser()

  const feed = await parser.parseURL(url);

  const normalized = feed.items.map(item => {return {title: item.title, url: item.link, description: item.contentSnippet, date: Date.parse(item.isoDate)}});

  if(isVerbose) {
    console.log(url + " sum element get: " + normalized.length)
    //console.log(normalized)
  }
  const dateFiltered = normalized.filter(d => d.date >= lastTime)
  const dataFiltered = dateFiltered.filter(d => {
    const text = d.title + " " + d.description
    const ws = config.interestingWords.filter(w => text.includes(w))
    const blacklist = config.blacklistedWords.filter(w => text.includes(w))
    const ret = (config.interestingWords.length === 0 || ws.length > 0) && blacklist.length === 0
    if(isVerbose && !ret) {
        console.info(d.title + " " + ws + " " + blacklist)
    }
    return ret
  })
  return dataFiltered
}

//data: [{title: "", description: "", url: ""}]
async function notify(data) {

  const splited = split(data, 10)

  if(isVerbose) {
    console.info("Will send: " + JSON.stringify(data))
    console.info("Will send: " + JSON.stringify(splited))
  }

  await Promise.all(splited.map(d =>
    axios.post(discordUrl, {
      embeds: d
    })
  ))
}

function split(array, n) {
  if(array.length === 0) {
    return array
  }
  let [...arr]  = array
  var res = []
  while (arr.length) {
    res.push(arr.splice(0, n))
  }
  return res
}
