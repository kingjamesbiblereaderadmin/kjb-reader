// Serves a standalone ES5-only KJB reader page (for IE11 / Windows Phone)
// as real HTML with a public URL — works where static /public files don't.
Deno.serve(async (req) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="windows-1252">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>KJB Reader (Legacy)</title>
<style type="text/css">
  body { margin:0; padding:0; background:#ffffff; color:#1a1a1a; font-family:Georgia,"Times New Roman",serif; font-size:18px; line-height:1.6; -webkit-text-size-adjust:100%; }
  .wrap { max-width:720px; margin:0 auto; padding:12px; }
  .header { background:#2d2a6e; color:#ffffff; padding:14px 12px; text-align:center; }
  .header h1 { margin:0; font-size:22px; font-weight:bold; }
  .header p { margin:4px 0 0 0; font-size:13px; color:#cfceec; font-family:Arial,sans-serif; }
  .controls { background:#f1f1f7; border:1px solid #cccccc; padding:10px; margin:12px 0; font-family:Arial,sans-serif; }
  .controls label { display:inline-block; font-size:13px; color:#333333; margin:0 4px 4px 0; }
  select { font-size:16px; padding:4px; margin:0 8px 6px 0; max-width:100%; }
  .btn { font-family:Arial,sans-serif; font-size:15px; padding:6px 14px; background:#2d2a6e; color:#ffffff; border:0; cursor:pointer; margin-right:6px; }
  .btn.alt { background:#777777; }
  .status { font-family:Arial,sans-serif; font-size:13px; color:#555555; padding:8px 0; }
  .err { color:#b00000; }
  .daily { background:#eef0fb; border:1px solid #c9cdee; padding:12px; margin:12px 0; }
  .daily .dlabel { font-family:Arial,sans-serif; font-size:11px; letter-spacing:1px; text-transform:uppercase; color:#5b59a0; margin:0 0 6px 0; }
  .daily .dtext { font-size:18px; color:#2d2a6e; margin:0 0 6px 0; font-style:italic; }
  .daily .dref { font-family:Arial,sans-serif; font-size:13px; color:#555555; margin:0; }
  h2.ref { font-size:20px; color:#2d2a6e; margin:16px 0 8px 0; }
  .verse { margin:0 0 6px 0; }
  .vnum { font-family:Arial,sans-serif; font-size:12px; color:#2d2a6e; font-weight:bold; vertical-align:super; margin-right:3px; }
  .ital { font-style:italic; color:#555555; }
  .nav { margin:18px 0; text-align:center; }
  .links { margin:12px 0; padding:12px; background:#f5f5f9; border:1px solid #dddddd; border-radius:8px; }
  .links a { display:inline-block; margin:4px 8px 4px 0; padding:6px 12px; background:#2d2a6e; color:#ffffff; text-decoration:none; border-radius:4px; font-family:Arial,sans-serif; font-size:13px; }
  .links a:hover { background:#3d3a7e; }
  .footer { font-family:Arial,sans-serif; font-size:12px; color:#888888; text-align:center; margin:24px 0 16px 0; padding-top:12px; border-top:1px solid #dddddd; }
</style>
</head>
<body>
<div class="header">
  <h1>King James Bible</h1>
  <p>Legacy Edition &mdash; for older browsers</p>
</div>
<div class="wrap">
  <div class="controls">
    <label for="bookSel">Book:</label>
    <select id="bookSel"></select>
    <label for="chapSel">Chapter:</label>
    <select id="chapSel"></select>
    <button type="button" class="btn" id="goBtn">Read</button>
  </div>
  <div class="status" id="status">Loading Bible text&hellip; please wait.</div>
  <div id="cacheBadge" style="display:none;font-family:Arial,sans-serif;font-size:12px;color:#1a7a3a;background:#e7f6ec;border:1px solid #b6e0c4;padding:6px 10px;margin:0 0 12px 0;">&#10003; Bible text saved on this device &mdash; loads instantly while you have a connection.</div>
  <div class="daily" id="daily" style="display:none;">
    <p class="dlabel">Verse of the Day</p>
    <p class="dtext" id="dtext"></p>
    <p class="dref" id="dref"></p>
  </div>
  <div class="links">
    <strong>Quick Links:</strong><br>
    <a href="/gospel" target="_blank">Gospel</a>
    <a href="/resources" target="_blank">Resources</a>
    <a href="/about" target="_blank">About</a>
    <a href="/" target="_blank">Full App</a>
  </div>
  <h2 class="ref" id="refTitle" style="display:none;"></h2>
  <div id="content"></div>
  <div class="nav" id="nav" style="display:none;">
    <button type="button" class="btn alt" id="prevBtn">&laquo; Previous</button>
    <button type="button" class="btn alt" id="nextBtn">Next &raquo;</button>
  </div>
  <div class="footer">
    King James Bible &mdash; Pure Cambridge Edition.<br>
    This is a simplified version for old devices.<br>
    For the full app, please use a modern browser (Edge or Chrome).
  </div>
</div>
<script type="text/javascript">
(function () {
  "use strict";
  var TEXT_URL = "https://media.base44.com/files/public/6a05d76723afe58d80c589e8/91ec9491e_WHARTON_PCE.txt";
  var ABBR_TO_NAME = {
    "Ge":"Genesis","Ex":"Exodus","Le":"Leviticus","Nu":"Numbers","De":"Deuteronomy",
    "Jos":"Joshua","Jg":"Judges","Ru":"Ruth","1Sa":"1 Samuel","2Sa":"2 Samuel",
    "1Ki":"1 Kings","2Ki":"2 Kings","1Ch":"1 Chronicles","2Ch":"2 Chronicles",
    "Ezr":"Ezra","Ne":"Nehemiah","Es":"Esther","Job":"Job","Ps":"Psalms","Pr":"Proverbs",
    "Ec":"Ecclesiastes","Song":"Song of Solomon","Isa":"Isaiah","Jer":"Jeremiah",
    "La":"Lamentations","Eze":"Ezekiel","Da":"Daniel","Ho":"Hosea","Joe":"Joel",
    "Am":"Amos","Ob":"Obadiah","Jon":"Jonah","Mic":"Micah","Na":"Nahum",
    "Hab":"Habakkuk","Zep":"Zephaniah","Hag":"Haggai","Zec":"Zechariah","Mal":"Malachi",
    "Mt":"Matthew","Mr":"Mark","Lu":"Luke","Joh":"John","Ac":"Acts","Ro":"Romans",
    "1Co":"1 Corinthians","2Co":"2 Corinthians","Ga":"Galatians","Eph":"Ephesians",
    "Php":"Philippians","Col":"Colossians","1Th":"1 Thessalonians","2Th":"2 Thessalonians",
    "1Ti":"1 Timothy","2Ti":"2 Timothy","Tit":"Titus","Phm":"Philemon","Heb":"Hebrews",
    "Jas":"James","1Pe":"1 Peter","2Pe":"2 Peter","1Jo":"1 John","2Jo":"2 John",
    "3Jo":"3 John","Jude":"Jude","Re":"Revelation"
  };
  var BOOK_ORDER = ["Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth","1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther","Job","Psalms","Proverbs","Ecclesiastes","Song of Solomon","Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi","Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"];
  var CACHE_KEY = "kjb_legacy_bible_text_v1";
  var EXCLUDED_REFS = {};
  (function(){ var arr=["Genesis 26:11","Genesis 33:14","Exodus 15:6","Exodus 18:23","Exodus 19:12","Exodus 21:12","Exodus 21:15","Exodus 21:16","Exodus 21:17","Exodus 21:29","Exodus 22:19","Exodus 31:14","Exodus 31:15","Exodus 35:2","Leviticus 5:5","Leviticus 16:21","Leviticus 19:20","Leviticus 20:2","Leviticus 20:9","Leviticus 20:10","Leviticus 20:11","Leviticus 20:12","Leviticus 20:13","Leviticus 20:15","Leviticus 20:16","Leviticus 20:27","Leviticus 24:16","Leviticus 24:17","Leviticus 24:21","Leviticus 27:29","Numbers 1:51","Numbers 3:10","Numbers 3:38","Numbers 5:7","Numbers 15:35","Numbers 18:7","Numbers 35:16","Numbers 35:17","Numbers 35:18","Numbers 35:21","Numbers 35:30","Numbers 35:31","Deuteronomy 13:5","Deuteronomy 17:6","Deuteronomy 21:22","Deuteronomy 24:16","Joshua 1:18","Judges 6:31","Judges 21:5","1 Samuel 11:13","2 Samuel 8:2","2 Samuel 19:21","2 Samuel 19:22","2 Samuel 21:9","1 Kings 1:12","1 Kings 2:24","1 Kings 8:33","1 Kings 8:35","1 Kings 20:31","2 Kings 14:6","1 Chronicles 16:34","1 Chronicles 16:41","2 Chronicles 5:13","2 Chronicles 6:24","2 Chronicles 6:26","2 Chronicles 7:3","2 Chronicles 7:6","2 Chronicles 15:13","2 Chronicles 20:21","2 Chronicles 23:7","Ezra 3:11","Nehemiah 1:6","Nehemiah 9:2","Esther 8:6","Job 8:15","Job 31:23","Psalms 2:9","Psalms 9:7","Psalms 30:5","Psalms 32:5","Psalms 52:1","Psalms 72:5","Psalms 72:7","Psalms 72:17","Psalms 81:15","Psalms 89:29","Psalms 89:36","Psalms 100:5","Psalms 102:12","Psalms 102:26","Psalms 104:31","Psalms 106:1","Psalms 107:1","Psalms 111:3","Psalms 111:10","Psalms 112:3","Psalms 112:9","Psalms 117:2","Psalms 118:1","Psalms 118:2","Psalms 118:3","Psalms 118:4","Psalms 118:29","Psalms 119:160","Psalms 135:13","Psalms 136:1","Psalms 136:2","Psalms 136:3","Psalms 136:4","Psalms 136:5","Psalms 136:6","Psalms 136:7","Psalms 136:8","Psalms 136:9","Psalms 136:10","Psalms 136:11","Psalms 136:12","Psalms 136:13","Psalms 136:14","Psalms 136:15","Psalms 136:16","Psalms 136:17","Psalms 136:18","Psalms 136:19","Psalms 136:20","Psalms 136:21","Psalms 136:22","Psalms 136:23","Psalms 136:24","Psalms 136:25","Psalms 136:26","Psalms 138:8","Psalms 145:13","Proverbs 27:24","Proverbs 28:13","Isaiah 13:16","Isaiah 13:18","Isaiah 45:20","Jeremiah 18:21","Jeremiah 33:11","Jeremiah 38:4","Ezekiel 22:14","Daniel 9:20","Hosea 10:14","Hosea 13:16","Nahum 2:1","Nahum 3:10","Matthew 3:6","Matthew 10:21","Matthew 10:22","Matthew 24:13","Mark 1:5","Mark 4:17","Mark 13:12","Mark 13:13","Luke 21:16","Luke 23:32","John 6:27","Acts 12:19","Acts 26:10","Romans 9:22","Romans 10:1","Romans 15:9","1 Corinthians 13:7","2 Thessalonians 1:4","2 Timothy 2:3","2 Timothy 2:10","2 Timothy 3:11","2 Timothy 4:3","2 Timothy 4:5","Hebrews 5:7","Hebrews 6:15","Hebrews 10:32","Hebrews 11:27","Hebrews 12:2","Hebrews 12:3","Hebrews 12:7","Hebrews 12:20","James 1:12","James 2:20","James 2:26","James 5:11","James 5:15","1 Peter 1:25","1 Peter 2:19","1 Peter 3:18","1 John 1:9"]; for(var i=0;i<arr.length;i++){ EXCLUDED_REFS[arr[i]]=true; } })();
  var data = {}; var availableBooks = []; var parsedOrder = [];
  var statusEl=document.getElementById("status"), bookSel=document.getElementById("bookSel"), chapSel=document.getElementById("chapSel"), goBtn=document.getElementById("goBtn"), refTitle=document.getElementById("refTitle"), contentEl=document.getElementById("content"), navEl=document.getElementById("nav"), prevBtn=document.getElementById("prevBtn"), nextBtn=document.getElementById("nextBtn");
  var dailyEl=document.getElementById("daily"), dtextEl=document.getElementById("dtext"), drefEl=document.getElementById("dref");
  var cacheBadge=document.getElementById("cacheBadge");
  function showCacheBadge(){ if(cacheBadge) cacheBadge.style.display="block"; }
  function setStatus(m,e){ statusEl.innerHTML=m; statusEl.className=e?"status err":"status"; }
  function esc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
  function renderVerseText(t){ t=t.replace(/\\u00B6\\s*/g,""); t=t.replace(/^<<[^>]*>>\\s*/,""); t=esc(t); t=t.replace(/\\[([^\\]]*)\\]/g,'<span class="ital">$1</span>'); return t; }
  function loadText(url,onDone,onFail){
    var xhr; try{ xhr=new XMLHttpRequest(); }catch(e){ try{ xhr=new ActiveXObject("Microsoft.XMLHTTP"); }catch(e2){ onFail("No XHR support"); return; } }
    var bust=url+(url.indexOf("?")===-1?"?":"&")+"t="+(new Date().getTime());
    xhr.open("GET",bust,true);
    if(xhr.overrideMimeType){ xhr.overrideMimeType("text/plain; charset=windows-1252"); }
    xhr.onreadystatechange=function(){ if(xhr.readyState===4){ if(xhr.status===200||xhr.status===0){ onDone(xhr.responseText); } else { onFail("HTTP "+xhr.status); } } };
    try{ xhr.send(null); }catch(e3){ onFail("Request failed"); }
  }
  function parseBible(text){
    var lines=text.split("\\n");
    for(var i=0;i<lines.length;i++){
      var trimmed=lines[i].replace(/^\\s+|\\s+$/g,""); if(!trimmed) continue;
      var spaceIdx=trimmed.indexOf(" "); if(spaceIdx===-1) continue;
      var abbr=trimmed.substring(0,spaceIdx); var rest=trimmed.substring(spaceIdx+1);
      var colonIdx=rest.indexOf(":"); if(colonIdx===-1) continue;
      var chapter=parseInt(rest.substring(0,colonIdx),10); if(isNaN(chapter)) continue;
      var spaceIdx2=rest.indexOf(" ",colonIdx); if(spaceIdx2===-1) continue;
      var verse=parseInt(rest.substring(colonIdx+1,spaceIdx2),10); var verseText=rest.substring(spaceIdx2+1);
      if(isNaN(verse)||!verseText) continue;
      var bookName=ABBR_TO_NAME[abbr]; if(!bookName) continue;
      verseText=verseText.replace(/\\s*\\u00B6\\s*\\[[^\\]]*\\]\\s*$/,"");
      if(!verseText.replace(/^\\s+|\\s+$/g,"")) continue;
      if(!data[bookName]){ data[bookName]={}; parsedOrder.push(bookName); }
      if(!data[bookName][chapter]) data[bookName][chapter]=[];
      data[bookName][chapter].push({verse:verse,text:verseText});
    }
    for(var b=0;b<BOOK_ORDER.length;b++){ if(data[BOOK_ORDER[b]]) availableBooks.push(BOOK_ORDER[b]); }
  }
  function fillBooks(){ var html=""; for(var i=0;i<availableBooks.length;i++){ html+='<option value="'+esc(availableBooks[i])+'">'+esc(availableBooks[i])+"</option>"; } bookSel.innerHTML=html; }
  function chaptersFor(bookName){ var nums=[]; var chapters=data[bookName]||{}; for(var key in chapters){ if(chapters.hasOwnProperty(key)) nums.push(parseInt(key,10)); } nums.sort(function(a,b){return a-b;}); return nums; }
  function fillChapters(bookName){ var nums=chaptersFor(bookName); var html=""; for(var i=0;i<nums.length;i++){ html+='<option value="'+nums[i]+'">'+nums[i]+"</option>"; } chapSel.innerHTML=html; }
  function showChapter(bookName,chapter){
    var verses=(data[bookName]&&data[bookName][chapter])?data[bookName][chapter]:null;
    if(!verses||!verses.length){ setStatus("Chapter not found.",true); return; }
    refTitle.style.display="block"; refTitle.innerHTML=esc(bookName)+" "+chapter;
    var html=""; for(var i=0;i<verses.length;i++){ html+='<p class="verse"><span class="vnum">'+verses[i].verse+"</span>"+renderVerseText(verses[i].text)+"</p>"; }
    contentEl.innerHTML=html; navEl.style.display="block"; setStatus("");
    try{ window.scrollTo(0,0); }catch(e){}
  }
  function currentBook(){ return bookSel.value; }
  function currentChapter(){ return parseInt(chapSel.value,10); }
  function goPrev(){
    var book=currentBook(); var nums=chaptersFor(book); var idx=-1;
    for(var i=0;i<nums.length;i++){ if(nums[i]===currentChapter()){ idx=i; break; } }
    if(idx>0){ chapSel.value=nums[idx-1]; showChapter(book,nums[idx-1]); }
    else { var bIdx=-1; for(var j=0;j<availableBooks.length;j++){ if(availableBooks[j]===book){ bIdx=j; break; } }
      if(bIdx>0){ var prevBook=availableBooks[bIdx-1]; bookSel.value=prevBook; fillChapters(prevBook); var pNums=chaptersFor(prevBook); var last=pNums[pNums.length-1]; chapSel.value=last; showChapter(prevBook,last); } }
  }
  function goNext(){
    var book=currentBook(); var nums=chaptersFor(book); var idx=-1;
    for(var i=0;i<nums.length;i++){ if(nums[i]===currentChapter()){ idx=i; break; } }
    if(idx>-1&&idx<nums.length-1){ chapSel.value=nums[idx+1]; showChapter(book,nums[idx+1]); }
    else { var bIdx=-1; for(var j=0;j<availableBooks.length;j++){ if(availableBooks[j]===book){ bIdx=j; break; } }
      if(bIdx>-1&&bIdx<availableBooks.length-1){ var nextBook=availableBooks[bIdx+1]; bookSel.value=nextBook; fillChapters(nextBook); var nNums=chaptersFor(nextBook); chapSel.value=nNums[0]; showChapter(nextBook,nNums[0]); } }
  }
  function readCache(){ try{ return window.localStorage ? window.localStorage.getItem(CACHE_KEY) : null; }catch(e){ return null; } }
  function writeCache(text){ try{ if(window.localStorage) window.localStorage.setItem(CACHE_KEY,text); }catch(e){} }
  function renderDaily(text,ref){ dtextEl.innerHTML=renderVerseText(text); drefEl.innerHTML=esc(ref); dailyEl.style.display="block"; }
  function computeDailyOffline(){
    var books=[]; for(var bi=0;bi<BOOK_ORDER.length;bi++){ if(data[BOOK_ORDER[bi]]) books.push(BOOK_ORDER[bi]); }
    if(!books.length) return null;
    var d=new Date();
    var seed=d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate();
    var cur=seed, bookName, chapterNum, verseObj;
    while(true){
      bookName=books[cur%books.length];
      var chapKeys=[]; for(var k in data[bookName]){ if(data[bookName].hasOwnProperty(k)) chapKeys.push(k); }
      chapterNum=chapKeys[cur%chapKeys.length];
      var verses=data[bookName][chapterNum];
      verseObj=verses[cur%verses.length];
      var ref=bookName+" "+chapterNum+":"+verseObj.verse;
      var isExcludedChapter=(bookName==="Romans"&&parseInt(chapterNum,10)===10);
      if(!EXCLUDED_REFS[ref]&&!isExcludedChapter) break;
      cur++;
    }
    return { text:verseObj.text, ref:bookName+" "+chapterNum+":"+verseObj.verse };
  }
  function showDailyVerse(){
    var local=computeDailyOffline();
    if(local) renderDaily(local.text,local.ref);
  }
  function onLoaded(text,fromCache){
    parseBible(text);
    if(!availableBooks.length){ setStatus("Bible text could not be read on this device.",true); return; }
    if(!fromCache) writeCache(text);
    if(readCache()) showCacheBadge();
    if(!fromCache){
      setStatus("&#10003; All 66 books downloaded &mdash; ready to read offline.");
      setTimeout(function(){ setStatus(""); },4000);
    }
    fillBooks(); bookSel.value=availableBooks[0]; fillChapters(availableBooks[0]); setStatus("");
    showDailyVerse();
    showChapter(availableBooks[0],chaptersFor(availableBooks[0])[0]);
  }
  function on(el,ev,fn){ if(el.addEventListener) el.addEventListener(ev,fn,false); else if(el.attachEvent) el.attachEvent("on"+ev,fn); }
  on(bookSel,"change",function(){ fillChapters(currentBook()); });
  on(goBtn,"click",function(){ showChapter(currentBook(),currentChapter()); });
  on(prevBtn,"click",goPrev);
  on(nextBtn,"click",goNext);
  var cached=readCache();
  if(cached&&cached.length>1000){
    setStatus("Loaded from device (offline ready).");
    onLoaded(cached,true);
    loadText(TEXT_URL,function(text){ if(text&&text.length>1000) writeCache(text); },function(){});
  } else {
    setStatus("Loading Bible text&hellip; please wait.");
    loadText(TEXT_URL,function(text){
      if(!text||text.length<1000){ setStatus("Could not load the Bible text. Please check your connection and refresh.",true); return; }
      onLoaded(text,false);
    },function(errMsg){ 
      var fallbackCached=readCache();
      if(fallbackCached&&fallbackCached.length>1000){
        setStatus("Network error - using cached version.");
        onLoaded(fallbackCached,true);
      } else {
        setStatus("Could not load the Bible text ("+esc(errMsg)+"). Please refresh.",true); 
      }
    });
  }
})();
</script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=windows-1252" }
  });
});