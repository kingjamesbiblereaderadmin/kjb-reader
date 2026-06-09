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
  h2.ref { font-size:20px; color:#2d2a6e; margin:16px 0 8px 0; }
  .verse { margin:0 0 6px 0; }
  .vnum { font-family:Arial,sans-serif; font-size:12px; color:#2d2a6e; font-weight:bold; vertical-align:super; margin-right:3px; }
  .ital { font-style:italic; color:#555555; }
  .nav { margin:18px 0; text-align:center; }
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
  var data = {}; var availableBooks = [];
  var statusEl=document.getElementById("status"), bookSel=document.getElementById("bookSel"), chapSel=document.getElementById("chapSel"), goBtn=document.getElementById("goBtn"), refTitle=document.getElementById("refTitle"), contentEl=document.getElementById("content"), navEl=document.getElementById("nav"), prevBtn=document.getElementById("prevBtn"), nextBtn=document.getElementById("nextBtn");
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
      if(!data[bookName]) data[bookName]={};
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
  function on(el,ev,fn){ if(el.addEventListener) el.addEventListener(ev,fn,false); else if(el.attachEvent) el.attachEvent("on"+ev,fn); }
  on(bookSel,"change",function(){ fillChapters(currentBook()); });
  on(goBtn,"click",function(){ showChapter(currentBook(),currentChapter()); });
  on(prevBtn,"click",goPrev);
  on(nextBtn,"click",goNext);
  setStatus("Loading Bible text&hellip; please wait.");
  loadText(TEXT_URL,function(text){
    if(!text||text.length<1000){ setStatus("Could not load the Bible text. Please check your connection and refresh.",true); return; }
    parseBible(text);
    if(!availableBooks.length){ setStatus("Bible text could not be read on this device.",true); return; }
    fillBooks(); bookSel.value=availableBooks[0]; fillChapters(availableBooks[0]); setStatus("");
    showChapter(availableBooks[0],chaptersFor(availableBooks[0])[0]);
  },function(errMsg){ setStatus("Could not load the Bible text ("+esc(errMsg)+"). Please refresh.",true); });
})();
</script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=windows-1252" }
  });
});