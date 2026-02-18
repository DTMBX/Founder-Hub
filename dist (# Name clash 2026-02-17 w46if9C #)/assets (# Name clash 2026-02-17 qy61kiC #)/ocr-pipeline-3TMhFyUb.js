class p{static DOCKET_PATTERNS=[/(?:docket|case)\s*(?:no\.?|number|#)?\s*:?\s*([A-Z]{1,3}[-\s]?\d{2,4}[-\s]?\d{2,6}[-\s]?[A-Z]?)/gi,/([A-Z]{1,3}[-\s]?\d{2,4}[-\s]?\d{2,6})/gi];static DATE_PATTERNS=[/(?:filed|received|entered|dated)(?:\s+on)?\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi,/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/g,/(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}/gi];static COURT_PATTERNS=[/(?:in\s+the\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:superior|supreme|district|circuit|appellate)\s+court/gi,/(?:superior|supreme|district|circuit|appellate)\s+court\s+of\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,/united\s+states\s+district\s+court/gi];static DOCUMENT_TYPE_KEYWORDS={complaint:["complaint","petition","plaintiff"],motion:["motion","moves","moving"],order:["order","ordered","adjudged"],certification:["certification","certifies","certified"],brief:["brief","memorandum of law"],transcript:["transcript","court reporter","proceedings"],exhibit:["exhibit","attachment"],notice:["notice of"],answer:["answer","defendant responds"],opposition:["opposition","response in opposition"]};static COURT_STAMP_INDICATORS=["filed","received","clerk","certified","seal","stamp"];static async processDocument(n,i={}){const e=Date.now(),c=i.extractText!==!1?await this.simulateTextExtraction(n):"",t={extractedText:c,extractionConfidence:.85,fields:{},courtStampDetection:{present:!1,confidence:0},metadata:{processingTime:0,documentQuality:"good"}};return i.extractFields!==!1&&c&&(t.fields=this.extractFields(c,n.name)),i.detectStamp!==!1&&c&&(t.courtStampDetection=this.detectCourtStamp(c)),t.metadata.processingTime=Date.now()-e,t.metadata.textDensity=c.length/1e3,t}static async simulateTextExtraction(n){await new Promise(c=>setTimeout(c,1500));const i=n.name.toLowerCase();let e=`SUPERIOR COURT OF NEW JERSEY
LAW DIVISION: ESSEX COUNTY

`;return i.includes("complaint")?(e+=`DEVON TYLER BARBER,
  Plaintiff,

v.

Docket No.: ESX-L-001234-23

CIVIL ACTION

COMPLAINT

`,e+=`Filed: 03/15/2023

The plaintiff hereby files this complaint...
`):i.includes("motion")?(e+=`Docket No.: ESX-L-001234-23

MOTION FOR SUMMARY JUDGMENT

Filed: 06/20/2023

`,e+=`The moving party respectfully moves this Court...
`):i.includes("order")?(e+=`Docket No.: ESX-L-001234-23

ORDER

Entered: 08/05/2023

`,e+=`This matter having come before the Court, IT IS HEREBY ORDERED...
`):i.includes("certification")?(e+=`Docket No.: ESX-L-001234-23

CERTIFICATION OF DEVON TYLER BARBER

`,e+=`Filed: 05/10/2023

I, Devon Tyler Barber, of full age, hereby certify...
`):(e+=`Docket No.: ESX-L-001234-23

Filed: ${new Date().toLocaleDateString()}

`,e+=`[Document content extracted from ${n.name}]
`),e+=`
[Simulated OCR extraction - In production, this would be real PDF text extraction]`,e}static extractFields(n,i){return{docket:this.extractDocket(n,i),filingDate:this.extractFilingDate(n,i),courtName:this.extractCourtName(n),documentType:this.extractDocumentType(n,i),parties:this.extractParties(n),caseNumber:this.extractCaseNumber(n)}}static extractDocket(n,i){const e=[];for(const a of this.DOCKET_PATTERNS){const o=new RegExp(a.source,a.flags);let s;for(;(s=o.exec(n))!==null;){const d=(s[1]||s[0]).replace(/\s+/g,"-").toUpperCase(),u=n.substring(Math.max(0,s.index-50),s.index),f=/docket|case/i.test(u);e.push({value:d,confidence:f?.92:.75,source:f?"context":"pattern"})}}const c=i.match(/([A-Z]{2,3}[-\s]?[A-Z]?[-\s]?\d{6}[-\s]?\d{2})/i);if(c&&e.push({value:c[1].replace(/\s+/g,"-").toUpperCase(),confidence:.88,source:"filename"}),e.length===0)return;e.sort((a,o)=>o.confidence-a.confidence);const t=e[0],r=e.slice(1,3).map(a=>({value:a.value,confidence:a.confidence}));return{value:t.value,confidence:t.confidence,source:t.source,reasoning:t.source==="context"?'Found near "docket" or "case" keyword with matching pattern':t.source==="filename"?"Extracted from filename using docket pattern":"Matched docket number pattern in document text",alternativeMatches:r.length>0?r:void 0}}static extractFilingDate(n,i){const e=[],c=/(?:filed|received|entered)(?:\s+on)?\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi;let t;for(;(t=c.exec(n))!==null;)e.push({value:this.normalizeDateString(t[1]),confidence:.95,source:"context"});const r=/(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2}),?\s+(\d{4})/gi;for(;(t=r.exec(n))!==null;){const d=`${t[1]} ${t[2]}, ${t[3]}`;e.push({value:d,confidence:.88,source:"pattern"})}const a=/\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/g;let o=0;for(;(t=a.exec(n))!==null&&o<3;)e.push({value:this.normalizeDateString(t[1]),confidence:.65,source:"pattern"}),o++;if(e.length===0)return;e.sort((d,u)=>u.confidence-d.confidence);const s=e[0],l=e.slice(1,3).map(d=>({value:d.value,confidence:d.confidence}));return{value:s.value,confidence:s.confidence,source:s.source,reasoning:s.source==="context"?'Found next to "filed", "received", or "entered" keyword':"Matched date pattern in document",alternativeMatches:l.length>0?l:void 0}}static extractCourtName(n){const i=[];for(const c of this.COURT_PATTERNS){const t=new RegExp(c.source,c.flags);let r;for(;(r=t.exec(n))!==null;){const a=r[0].trim(),o=r.index<500;i.push({value:a,confidence:o?.92:.78})}}if(i.length===0)return;i.sort((c,t)=>t.confidence-c.confidence);const e=i[0];return{value:e.value,confidence:e.confidence,source:"pattern",reasoning:e.confidence>.85?"Court name found in header area with standard format":"Court name matched standard pattern"}}static extractDocumentType(n,i){const e=n.toLowerCase(),c=i.toLowerCase(),t=[];for(const[o,s]of Object.entries(this.DOCUMENT_TYPE_KEYWORDS)){let l=0,d=0;for(const u of s){if(e.includes(u)){const f=e.indexOf(u);f<500?l=Math.max(l,.9):f<1500?l=Math.max(l,.75):l=Math.max(l,.6)}c.includes(u)&&(d=Math.max(d,.85))}l>0&&t.push({type:o.charAt(0).toUpperCase()+o.slice(1),confidence:l,source:"text"}),d>0&&t.push({type:o.charAt(0).toUpperCase()+o.slice(1),confidence:d,source:"filename"})}if(t.length===0)return;t.sort((o,s)=>s.confidence-o.confidence);const r=t[0],a=t.slice(1,3).filter(o=>o.type!==r.type).map(o=>({value:o.type,confidence:o.confidence}));return{value:r.type,confidence:r.confidence,source:r.source,reasoning:r.source==="text"?"Document type keywords found in text content":"Document type detected from filename",alternativeMatches:a.length>0?a:void 0}}static extractParties(n){const i=/([A-Z][A-Z\s,\.]+)\s+(?:v\.|vs\.|versus)\s+([A-Z][A-Z\s,\.]+)/i,e=n.match(i);if(!e)return;const c=e[1].trim(),t=e[2].trim();return{value:`${c} v. ${t}`,confidence:.82,source:"pattern",reasoning:"Party names extracted using v./vs./versus pattern"}}static extractCaseNumber(n){const e=/case\s+(?:no\.?|number)\s*:?\s*(\d{1,2}[-\s]?[A-Z]{2,4}[-\s]?\d{4,6})/gi.exec(n);if(e)return{value:e[1].trim(),confidence:.85,source:"pattern",reasoning:'Case number found with "case no." or "case number" label'}}static detectCourtStamp(n){const i=n.toLowerCase();let e=0,c="unknown";for(const o of this.COURT_STAMP_INDICATORS)i.includes(o)&&(e+=.25,o==="filed"&&c==="unknown"?c="filed":o==="received"&&c==="unknown"?c="received":o==="certified"&&c==="unknown"&&(c="certified"));/(?:filed|received).*?\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/i.test(n)&&(e+=.3);const r=e>.4,a=Math.min(e,1);return{present:r,confidence:r?a:0,stampType:r?c:void 0,region:r?{x:50,y:50,width:200,height:100,page:0}:void 0}}static normalizeDateString(n){const i=n.split(/[\/\-]/);if(i.length===3){const[e,c,t]=i,r=t.length===2?`20${t}`:t;return`${e.padStart(2,"0")}/${c.padStart(2,"0")}/${r}`}return n}static getConfidenceLevel(n){return n>=.85?{level:"high",color:"text-green-400",label:"High Confidence"}:n>=.65?{level:"medium",color:"text-yellow-400",label:"Medium Confidence"}:{level:"low",color:"text-orange-400",label:"Low Confidence"}}}export{p as O};
