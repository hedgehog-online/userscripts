// ==UserScript==
// @name     		Twitter July 15
// @description	no more bluechecks
// @include     https://twitter.com/*
// @version  		1
// @grant    		none
// ==/UserScript==

console.log('july 15 2020');
let chill = false;

let observer = new MutationObserver(async function() {
  if (chill) { return; }
  chill = true;
  setTimeout(() => chill = false, 500);
  
  for (const bluecheck of document.querySelectorAll(`:not(.july-15) svg[aria-label="Verified account"]:not(.july-15)`)) {
    bluecheck.classList.add("july-15");
    
    // hahahahaha i hate react so much
    console.log(`🦀 silence, ${bluecheck.parentElement.parentElement.innerText}`);
    
    // 1. hide bluecheck dms  
    if (bluecheck.closest(`[aria-label="Section details"]`) != null) {
    	remove(bluecheck.closest(`[aria-label="Section details"]`).childNodes[1]);
      remove(bluecheck.closest(`h2`).parentElement.remove());
    }
    
    // 2. hide bluecheck profiles
    else if (bluecheck.closest(`h2`) != null) {
      // delete tweets
      remove(bluecheck.closest(`[data-testid="primaryColumn"]`).firstChild.childNodes[1]);  
      
      // delete follow button
      setTimeout(() => {
        hide(document.querySelector(`[data-testid="primaryColumn"] [data-testid*="follow"]`));
      }, 100);
      
      // delete the username
      remove(bluecheck.closest(`h2`).parentElement);
      
      // delete content sidebar
      setTimeout(() => {
        remove(document.querySelector(`[data-testid="tweetPhoto"]`).parentElement.parentElement.parentElement.parentElement);
      }, 1500);
    }
    
    // 3. hide bluecheck tweets
    else if (bluecheck.closest(`article`) != null) {
      const article = bluecheck.closest(`article`);
      const container = article.closest(`div:not([class]):not([id])`);
      hide(container);
      remove(article);
    }
    
    // 4. hide other weird stuff
    else {
	    hide(bluecheck.closest(`[data-testid="UserCell"], a[href*="/i/events/"], [data-testid="trend"], [role="option"], [data-testid="conversation"], [aria-label="Section details"]`));
    }
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

function hide(element) {
	if (element != null) {
  	element.style.display = "none";
    element.classList.add("july-15");
  }
}

function remove(element) {
	if (element != null) {
  	element.remove();
  }
}
