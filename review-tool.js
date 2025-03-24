(async function(){
  const endpoint = "https://script.google.com/macros/s/AKfycbwKsFrlDHadwupHmWbmv9S8z_3Stt_vlR0LyoQbNE2svYL9h2sTUv-HF3wQp4RNAYJT/exec";
  const sessionKey = "__review_export_ready";

  const name = prompt("请输入用户名（系统将记录配额）");
  if (!name) {
    alert("用户名不能为空！");
    return;
  }

  const res = await fetch(endpoint + "?name=" + encodeURIComponent(name)).then(r=>r.json());
  if (!res.authorized) {
    alert("未授权或配额已用完！");
    return;
  }
  alert("验证成功，剩余使用次数：" + res.remaining + " 次");

  const isFirstPage = !window.location.href.includes("pageNumber");
  if (!isFirstPage) {
    let url = window.location.href;
    url = url.replace(/(pageNumber=)[0-9]+/, "pageNumber=1");
    url = url.replace(/(ref=cm_cr_arp_d_paging_btm_[0-9]+)/, "ref=cm_cr_arp_d_viewopt_sr");
    if (!url.includes("pageNumber=")) {
      url += (url.includes("?") ? "&" : "?") + "pageNumber=1";
    }
    sessionStorage.setItem(sessionKey, "1");
    window.location.href = url;
    return;
  }

  if (sessionStorage.getItem(sessionKey) === "1") {
    sessionStorage.removeItem(sessionKey);
    setTimeout(() => startExportUI(), 1000);
  } else {
    startExportUI();
  }

  function startExportUI(){
    if(document.getElementById("review-export-ui")) return;
    const s=document.createElement("style");
    s.textContent="#review-export-ui{position:fixed;top:20%;left:50%;transform:translateX(-50%);background:white;border:2px solid #444;border-radius:8px;padding:20px;z-index:99999;box-shadow:0 4px 12px rgba(0,0,0,0.2);font-family:sans-serif;}#review-export-ui h3{margin-top:0;}#review-export-ui label{display:inline-block;margin:5px;padding:6px 10px;border:1px solid #888;border-radius:4px;cursor:pointer;user-select:none;}#review-export-ui label.selected{background:#007bff;color:white;border-color:#0056b3;}#review-export-ui button{margin-top:10px;padding:6px 14px;font-size:14px;}";
    document.head.appendChild(s);
    const b=document.createElement("div");
    b.id="review-export-ui";
    b.innerHTML='<h3>选择要导出的星级</h3><div><label data-star="1">⭐️ 1</label><label data-star="2">⭐️ 2</label><label data-star="3">⭐️ 3</label><label data-star="4">⭐️ 4</label><label data-star="5">⭐️ 5</label></div><button id="export-confirm">导出</button><button id="export-cancel">取消</button>';
    document.body.appendChild(b);
    document.querySelectorAll("#review-export-ui label").forEach(l=>l.addEventListener("click",()=>l.classList.toggle("selected")));
    document.getElementById("export-cancel").onclick=()=>b.remove();
    document.getElementById("export-confirm").onclick=()=>{
      const s=[...document.querySelectorAll("#review-export-ui label.selected")].map(el=>parseInt(el.dataset.star));
      if(s.length===0){alert("请至少选择一个星级");return;}
      const m=parseInt(prompt("请输入最多导出评论数量：","200"));
      if(!m||isNaN(m)||m<=0){alert("请输入有效数字");return;}
      b.remove(); runExport(s,m);
    };
  }

  function delay(ms){return new Promise(res=>setTimeout(res,ms));}
  async function runExport(starsArr,maxCount){
    let reviews=[],page=1;
    while(reviews.length<maxCount){
      document.querySelectorAll(".review").forEach(r=>{
        const st=parseFloat(r.querySelector(".review-rating")?.innerText||"");
        const tf=r.querySelector(".review-title")?.innerText.trim()||"";
        const ti=tf.split("\n").pop().trim();
        const bo=r.querySelector(".review-text-content")?.innerText.trim()||"";
        const dt=(r.querySelector("[data-hook='review-date']")?.innerText||"").split(" on ").pop()?.trim()||"";
        const hi=r.querySelector(".review-image-tile-section")?"Yes":"No";
        const hv=r.querySelector("video, .review-video-tile-section")?"Yes":"No";
        const fo=r.querySelector("[data-hook='format-strip']")?.innerText||"";
        let co="",si="";
        fo.split("|").forEach(p=>{
          if(p.includes("Color:")) co=p.split("Color:")[1].trim();
          if(p.includes("Size:")) si=p.split("Size:")[1].trim();
        });
        const vp=r.querySelector("[data-hook='avp-badge']")?"Yes":"No";
        if(starsArr.includes(st)) reviews.push({stars:st,date:dt,color:co,size:si,title:ti,body:bo,verified:vp,hasImage:hi,hasVideo:hv});
      });
      if(reviews.length>=maxCount) break;
      const n=document.querySelector("li.a-last a");
      if(!n||n.getAttribute("aria-disabled")==="true") break;
      n.click(); page++; await delay(3000);
    }
    if(reviews.length===0){alert("未找到符合条件的评论");return;}
    const rows=[["Stars","Date","Color","Size","Title","Body","Verified","HasImage","HasVideo"]];
    reviews.slice(0,maxCount).forEach(r=>{
      rows.push([r.stars,r.date,r.color,r.size,r.title.replace(/"/g,'""'),r.body.replace(/"/g,'""'),r.verified,r.hasImage,r.hasVideo]);
    });
    const csv=rows.map(row=>row.map(f=>`"${f}"`).join(",")).join("\n");
    const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    a.download=`amazon_reviews_${starsArr.join("_")}_stars_max${maxCount}.csv`;
    a.click();
  }
})();