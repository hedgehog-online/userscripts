// ==UserScript==
// @name     		Twitter Web App Video Player Unfuckifier
// @description	Holy shit is this website bad 
// @include     https://twitter.com/*
// @version  		1
// @grant    		none
// ==/UserScript==

// TURN OFF AUTOPLAY OR THIS WON'T WORK: https://twitter.com/settings/autoplay

console.log('fuck');

const tweetIdRegex = /status\/(\d*)(\/likes)?$/;

const imgTemplate = document.createElement('img');
imgTemplate.style = "object-fit: contain; height: 100%;";
const videoTemplate = document.createElement('video');
videoTemplate.style = "width: 100%; height: 100%;";
videoTemplate.autoplay = true;
videoTemplate.controls = true;

async function fixVideoEmbed(embed) {            //  \bad/
  const url = embed.closest("article").querySelector("a time")?.parentElement?.href || window.location.pathname;
  const tweetId = url.match(tweetIdRegex)[1];  
  
  console.log("fixing", tweetId);
  
  const videoInfo = getTweetVideoInfo(tweetId, embed.closest(`[role="blockquote"]`) != null);

  const parent = embed.parentElement;
  const clone = embed.cloneNode(true);
  clone.classList.add("fixed");
  clone.style = "background: black;";

  const img = imgTemplate.cloneNode();
  clone.firstElementChild.appendChild(img);

  const [thumbnail, videoUrl] = await videoInfo;
  img.src = thumbnail;

  clone.addEventListener("click", async function(e) {
  	e.stopPropagation();
  	console.log("replacing", tweetId);
    const clone2 = clone.cloneNode();
    const video = videoTemplate.cloneNode();
    video.src = videoUrl;
  	video.loop = clone2.getAttribute("aria-label").includes("GIF");
    clone2.appendChild(video);

    // give the video a few moments to get set up
    setTimeout(() => parent.replaceChild(clone2, clone), 100);
  });
  parent.replaceChild(clone, embed);
}

const observer = new MutationObserver(async function(mutationsList) {
  for (const embed of document.querySelectorAll(`main section article div[aria-label*="Play this"][data-testid="previewInterstitial"]:not(.fixed)`)) {  
    fixVideoEmbed(embed);
  }
});




// https://github.com/Bl4Cc4t/GoodTwitter2/blob/master/twitter.gt2eb.user.js
// request headers
const setup = {
    "credentials": "include",
    "headers": {
        "Accept-Language": "en-US,en;q=0.5",
        "x-twitter-auth-type": "OAuth2Session",
        "x-twitter-client-language": "en",
        "x-twitter-active-user": "yes",
        "x-csrf-token": window.document.cookie.match(/ct0=([^;]+)(;|$)/)[1],
        "authorization": "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA"
    },
    "method": "GET",
    "mode": "cors"
};

async function getTweetInfo(tweetId) {
	console.log("getting", tweetId);
  return fetch(`https://api.twitter.com/2/timeline/conversation/${tweetId}.json?` +
               `include_profile_interstitial_type=1&include_blocking=1&` +
               `include_blocked_by=1&include_followed_by=1&include_want_retweets=1&` +
               `include_mute_edge=1&include_can_dm=1&include_can_media_tag=1&` +
               `skip_status=1&cards_platform=Web-12&include_cards=1&` +
               `include_ext_alt_text=true&include_quote_count=true&` +
               `include_reply_count=1&tweet_mode=extended&include_entities=true&` +
               `include_user_entities=true&include_ext_media_color=true&` +
               `include_ext_media_availability=true&send_error_codes=true&` +
               `simple_quoted_tweet=true&count=20&referrer=me&ext=mediaStats,highlightedLabel`, // jesus christ
               setup).then(x => x.json());
}

const tweetVideoInfoCache = new Map();
const tweetQuoteMapping = new Map();

async function getTweetVideoInfo(tweetId, getQuoteMedia) {
  if (!tweetVideoInfoCache.has(tweetId)) {
      await requestInfo(tweetId);
  }
  if (getQuoteMedia) {
    return await tweetVideoInfoCache.get(tweetQuoteMapping.get(tweetId));
  } else {
    return await tweetVideoInfoCache.get(tweetId);
  }
}

async function requestInfo(tweetId, info) {
  const result = async function() {
    info = info || await getTweetInfo(tweetId);
    // get media in qrts too
    let quotedTweetId = info.globalObjects.tweets[tweetId].quoted_status_id_str;
    if (quotedTweetId) {
      tweetQuoteMapping.set(tweetId, quotedTweetId);
      console.log(tweetId, "quotes", quotedTweetId);
      requestInfo(quotedTweetId, info);
    }

    let variants = null;
    let thumbnail = null;

    if (info?.globalObjects?.tweets?.[tweetId]?.extended_entities) {
      for (const media of info.globalObjects.tweets[tweetId].extended_entities.media) {
        if (media.type = "video") {
          variants = media.video_info.variants;
          thumbnail = media.media_url_https;
          break;
        }
      }
    }

    if (variants) {
      let chosen = null;
      for (const variant of variants) {
        if (variant.bitrate >= (chosen?.bitrate || 0)) {
          chosen = variant;
        }
      }                          
      return [thumbnail, chosen.url];
    } else {
      return null;
    }
  }();
  tweetVideoInfoCache.set(tweetId, result);
  await result;
}

observer.observe(document.body, { // lmao
  childList: true,
  subtree: true
});
