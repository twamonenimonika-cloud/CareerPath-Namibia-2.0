const API="/api";
const subjects=["English","Mathematics","Physical Science","Biology","Chemistry","Agriculture","Geography","History","Accounting","Economics","Business Studies","Computer Studies"];
const quiz=[
 ["What activity sounds most interesting?",[["<i class="fa-solid fa-laptop-code"></i> Solving technology problems",["software-developer"]],["<i class="fa-solid fa-heart-pulse"></i> Helping people with health problems",["medical-doctor","registered-nurse"]],["<i class="fa-solid fa-helmet-safety"></i> Designing or building things",["civil-engineer"]],["<i class="fa-solid fa-lightbulb"></i> Creating a business",["entrepreneur","accountant"]]]],
 ["Which school area attracts you most?",[["<i class="fa-solid fa-square-root-variable"></i> Mathematics",["software-developer","civil-engineer","accountant"]],["<i class="fa-solid fa-flask"></i> Science",["medical-doctor","registered-nurse","agricultural-scientist"]],["<i class="fa-solid fa-book-open"></i> Reading and communication",["teacher","legal-professional","tourism-manager"]],["<i class="fa-solid fa-chart-line"></i> Business and money",["accountant","entrepreneur"]]]],
 ["What environment can you imagine?",[["<i class="fa-solid fa-microchip"></i> Technology and digital work",["software-developer"]],["<i class="fa-solid fa-hospital"></i> Healthcare",["medical-doctor","registered-nurse"]],["<i class="fa-solid fa-school"></i> Education",["teacher"]],["<i class="fa-solid fa-earth-africa"></i> Outdoors and fieldwork",["agricultural-scientist","civil-engineer","tourism-manager"]]]]
];
let token=localStorage.getItem("cp_token")||"";
let user=JSON.parse(localStorage.getItem("cp_user")||"null");
let selected=JSON.parse(localStorage.getItem("cp_subjects")||"[]");
let careers=[];

const subjectIcons={
  "English":"fa-book-open","Mathematics":"fa-square-root-variable","Physical Science":"fa-atom",
  "Biology":"fa-dna","Chemistry":"fa-flask","Agriculture":"fa-wheat-awn",
  "Geography":"fa-earth-africa","History":"fa-landmark","Accounting":"fa-calculator",
  "Economics":"fa-chart-line","Business Studies":"fa-briefcase","Computer Studies":"fa-laptop-code"
};
const careerIcons={
  "software-developer":"fa-laptop-code","medical-doctor":"fa-user-doctor","registered-nurse":"fa-user-nurse",
  "civil-engineer":"fa-helmet-safety","teacher":"fa-chalkboard-user","accountant":"fa-calculator",
  "agricultural-scientist":"fa-wheat-awn","tourism-manager":"fa-plane-departure","legal-professional":"fa-scale-balanced",
  "entrepreneur":"fa-lightbulb"
};
const categoryIcons={Technology:"fa-microchip",Health:"fa-heart-pulse",Engineering:"fa-gears",Education:"fa-school",Business:"fa-briefcase",Agriculture:"fa-seedling",Tourism:"fa-map-location-dot",Law:"fa-scale-balanced"};
function icon(slug,category){return careerIcons[slug]||categoryIcons[category]||"fa-compass"}
function careerIcon(c){return `<i class="fa-solid ${icon(c.slug,c.category)}" aria-hidden="true"></i>`}
function subjectIcon(s){return `<i class="fa-solid ${subjectIcons[s]||"fa-book"}" aria-hidden="true"></i>`}

function headers(){return token?{"Content-Type":"application/json","Authorization":"Bearer "+token}:{"Content-Type":"application/json"}}
async function api(path,opts={}){const r=await fetch(API+path,{...opts,headers:{...headers(),...(opts.headers||{})}});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||"Something went wrong");return d}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function saveLocal(){localStorage.setItem("cp_subjects",JSON.stringify(selected))}
function openModal(html){document.getElementById("modalBody").innerHTML=html;document.getElementById("modal").classList.add("open")}
function closeModal(){document.getElementById("modal").classList.remove("open")}
function careerBySlug(slug){return careers.find(c=>c.slug===slug)}

function renderQuiz(){
 const box=document.getElementById("quizBox");
 box.innerHTML=quiz.map((q,i)=>`<div class="quiz-question"><h3>${i+1}. ${q[0]}</h3><div class="answers">${q[1].map((a,j)=>`<label class="answer"><input type="radio" name="q${i}" value="${j}"> ${a[0]}</label>`).join("")}</div></div>`).join("")+`<div class="actions"><button class="btn primary" id="quizSubmit">Show my matches</button><button class="btn ghost" id="quizReset">Reset</button></div><div id="quizResults" class="results"></div>`;
 document.getElementById("quizSubmit").onclick=runQuiz;
 document.getElementById("quizReset").onclick=()=>{document.querySelectorAll("#quizBox input").forEach(x=>x.checked=false);document.getElementById("quizResults").innerHTML="";localStorage.removeItem("cp_quiz")};
}
async function runQuiz(){
 const scores={};let ok=true;
 quiz.forEach((q,i)=>{const v=document.querySelector(`input[name=q${i}]:checked`);if(!v){ok=false;return}q[1][v.value][1].forEach(s=>scores[s]=(scores[s]||0)+1)});
 if(!ok){document.getElementById("quizResults").innerHTML='<p class="error">Please answer all questions.</p>';return}
 const ranked=Object.entries(scores).sort((a,b)=>b[1]-a[1]).map(([slug])=>careerBySlug(slug)).filter(Boolean).slice(0,3);
 localStorage.setItem("cp_quiz","1");
 document.getElementById("quizResults").innerHTML=`<h3><i class="fa-solid fa-bullseye"></i> Careers worth exploring</h3>${ranked.map(c=>`<div class="result"><div><strong class="result-title">${careerIcon(c)} ${esc(c.name)}</strong><br><span class="muted">${esc(c.description)}</span></div><button class="btn ghost" onclick="showCareer('${c.slug}')">Explore</button></div>`).join("")}`;
 if(token) api("/quiz-results",{method:"POST",body:JSON.stringify({results:ranked.map(c=>c.slug)})}).catch(()=>{});
 updateDashboard();
}

function renderSubjects(){
 document.getElementById("subjectList").innerHTML=subjects.map(s=>`<label class="subject"><input type="checkbox" value="${s}" ${selected.includes(s)?"checked":""}><span class="subject-icon">${subjectIcon(s)}</span>${s}</label>`).join("");
 document.querySelectorAll("#subjectList input").forEach(x=>x.onchange=()=>{selected=[...document.querySelectorAll("#subjectList input:checked")].map(i=>i.value);saveLocal();updateDashboard()});
 document.getElementById("matchBtn").onclick=matchSubjects;
 document.getElementById("clearSubjects").onclick=()=>{selected=[];saveLocal();renderSubjects();document.getElementById("matchResults").innerHTML="";updateDashboard()};
}
function matchSubjects(){
 if(!selected.length){document.getElementById("matchResults").innerHTML='<p class="error">Select at least one subject first.</p>';return}
 const results=careers.map(c=>{const matched=c.required_subjects.filter(s=>selected.includes(s)).length;return {...c,pct:Math.round(matched/c.required_subjects.length*100),missing:c.required_subjects.filter(s=>!selected.includes(s))}}).sort((a,b)=>b.pct-a.pct).slice(0,8);
 document.getElementById("matchResults").innerHTML=`<h3><i class="fa-solid fa-bullseye"></i> Your subject matches</h3>${results.map(c=>`<div class="result"><div><strong class="result-title">${careerIcon(c)} ${esc(c.name)}</strong><br><span class="muted">${c.missing.length?"Still explore: "+esc(c.missing.join(", ")):"Strong coverage of listed core subjects"}</span></div><span class="badge">${c.pct}% guidance match</span></div>`).join("")}`;
 updateDashboard();
}

async function loadCareers(){
 careers=await api("/careers");
 const cats=await api("/categories");
 document.getElementById("category").innerHTML='<option value="">All career fields</option>'+cats.map(c=>`<option>${esc(c)}</option>`).join("");
 renderCareers();
}
function renderCareers(){
 const q=document.getElementById("search").value.toLowerCase(), cat=document.getElementById("category").value;
 const rows=careers.filter(c=>(!cat||c.category===cat)&&(`${c.name} ${c.description} ${c.category}`.toLowerCase().includes(q)));
 document.getElementById("careerGrid").innerHTML=rows.map(c=>`<article class="career-card"><div class="icon">${careerIcon(c)}</div><span class="tag">${esc(c.category)}</span><h3>${esc(c.name)}</h3><p>${esc(c.description)}</p><div class="card-actions"><button class="btn ghost" onclick="showCareer('${c.slug}')">Details</button><button class="btn primary" onclick="saveCareer(${c.id})">⭐ Save</button></div></article>`).join("")||"<p>No careers found.</p>";
}
function showCareer(slug){
 const c=careerBySlug(slug); if(!c)return;
 openModal(`<div class="icon">${careerIcon(c)}</div><h2>${esc(c.name)}</h2><p>${esc(c.description)}</p><h3><i class="fa-solid fa-book-open"></i> Core subjects to explore</h3>${c.required_subjects.map(x=>`<span class="tag">${esc(x)}</span>`).join("")}<h3><i class="fa-solid fa-plus-circle"></i> Useful additional subjects</h3>${c.recommended_subjects.map(x=>`<span class="tag">${esc(x)}</span>`).join("")}<h3><i class="fa-solid fa-screwdriver-wrench"></i> Useful skills</h3>${c.skills.map(x=>`<span class="tag">${esc(x)}</span>`).join("")}<h3><i class="fa-solid fa-briefcase"></i> Possible roles</h3><p>${esc(c.jobs.join(" • "))}</p><h3><i class="fa-solid fa-route"></i> Example pathway</h3><p>${esc(c.pathway)}</p><p class="notice">Guidance information only. Verify current admission and professional requirements with the relevant official institution or authority.</p><button class="btn primary" onclick="saveCareer(${c.id})">Save career</button>`);
}

async function saveCareer(id){
 if(!token){openAuth();return}
 try{await api("/me/saved/"+id,{method:"POST"});await updateDashboard();alert("Career saved to your dashboard.");}catch(e){alert(e.message)}
}

async function updateDashboard(){
 const quizDone=localStorage.getItem("cp_quiz")==="1";
 let progress=(quizDone?35:0)+(selected.length?30:0);
 let saved=[];
 if(token){try{saved=await api("/me/saved");if(saved.length)progress+=35}catch{}}
 document.getElementById("progressFill").style.width=progress+"%";
 document.getElementById("progressText").textContent=progress+"% complete";
 document.getElementById("dashMessage").textContent=user?`Welcome back, ${user.name}. Your saved careers are available below.`:"Sign in to save your career plan across sessions.";
 document.getElementById("savedList").innerHTML=!token?'<p class="muted">Sign in to save careers permanently.</p>':saved.length?saved.map(c=>`<div class="saved"><strong class="result-title">${careerIcon(c)} ${esc(c.name)}</strong><br><button class="btn ghost" onclick="showCareer('${c.slug}')">View</button> <button class="btn ghost" onclick="removeCareer(${c.id})">Remove</button></div>`).join(""):'<p class="muted">No saved careers yet. Explore the Career Library.</p>';
 if(user?.role==="admin") renderAdmin();
 else document.getElementById("adminArea").innerHTML="";
}
async function removeCareer(id){await api("/me/saved/"+id,{method:"DELETE"});updateDashboard()}
async function renderAdmin(){
 const stats=await api("/admin/stats");
 document.getElementById("adminArea").innerHTML=`<div class="panel admin-panel"><p class="eyebrow">ADMINISTRATOR</p><h3>Platform overview</h3><p><strong>${stats.users}</strong> students · <strong>${stats.careers}</strong> careers · <strong>${stats.saved}</strong> saved careers · <strong>${stats.opportunities}</strong> active opportunities</p><div class="actions"><button class="btn primary" onclick="openOpportunityForm()">Add opportunity</button></div></div>`;
}
function openOpportunityForm(){
 openModal(`<h2>Add opportunity</h2><form id="oppForm"><div class="form-row"><label>Title</label><input name="title" required></div><div class="form-row"><label>Organisation</label><input name="organisation" required></div><div class="form-row"><label>Type</label><input name="type" placeholder="Scholarship, Internship..." required></div><div class="form-row"><label>Description</label><input name="description" required></div><div class="form-row"><label>Deadline</label><input name="deadline" type="date"></div><div class="form-row"><label>Source URL</label><input name="url"></div><label class="subject"><input name="verified" type="checkbox"> Information verified by administrator</label><div class="actions"><button class="btn primary">Publish</button></div></form>`);
 document.getElementById("oppForm").onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);const body=Object.fromEntries(f);body.verified=f.get("verified")==="on";try{await api("/admin/opportunities",{method:"POST",body:JSON.stringify(body)});closeModal();loadOpportunities();updateDashboard()}catch(err){alert(err.message)}};
}
async function loadOpportunities(){
 const rows=await api("/opportunities");
 document.getElementById("opportunityList").innerHTML=rows.map(o=>`<article class="feature"><span class="tag">${esc(o.type)}</span>${o.verified?'<span class="tag">✓ Admin verified</span>':""}<h3>${esc(o.title)}</h3><p><strong>${esc(o.organisation)}</strong></p><p>${esc(o.description)}</p>${o.deadline?`<p><strong>Deadline:</strong> ${esc(o.deadline)}</p>`:""}${o.url?`<a class="btn ghost" href="${esc(o.url)}" target="_blank" rel="noopener">Open source</a>`:""}</article>`).join("");
}

function openAuth(){
 openModal(`<div class="auth-tabs"><button class="btn primary" id="loginTab">Sign in</button><button class="btn ghost" id="registerTab">Create account</button></div><div id="authForm"></div>`);
 showLogin();
 document.getElementById("loginTab").onclick=showLogin;document.getElementById("registerTab").onclick=showRegister;
}
function showLogin(){
 document.getElementById("authForm").innerHTML=`<h2>Welcome back</h2><form id="loginForm"><div class="form-row"><label>Email</label><input name="email" type="email" required></div><div class="form-row"><label>Password</label><input name="password" type="password" required></div><button class="btn primary">Sign in</button></form>`;
 document.getElementById("loginForm").onsubmit=async e=>{e.preventDefault();try{const f=Object.fromEntries(new FormData(e.target));const d=await api("/auth/login",{method:"POST",body:JSON.stringify(f)});setSession(d);closeModal()}catch(err){alert(err.message)}};
}
function showRegister(){
 document.getElementById("authForm").innerHTML=`<h2>Create your account</h2><form id="registerForm"><div class="form-row"><label>Name</label><input name="name" required></div><div class="form-row"><label>Email</label><input name="email" type="email" required></div><div class="form-row"><label>Password</label><input name="password" type="password" minlength="8" required></div><button class="btn primary">Create account</button></form>`;
 document.getElementById("registerForm").onsubmit=async e=>{e.preventDefault();try{const f=Object.fromEntries(new FormData(e.target));const d=await api("/auth/register",{method:"POST",body:JSON.stringify(f)});setSession(d);closeModal()}catch(err){alert(err.message)}};
}
function setSession(d){token=d.token;user=d.user;localStorage.setItem("cp_token",token);localStorage.setItem("cp_user",JSON.stringify(user));document.getElementById("authBtn").textContent="Sign out";document.getElementById("authBtn").onclick=logout;updateDashboard()}
function logout(){token="";user=null;localStorage.removeItem("cp_token");localStorage.removeItem("cp_user");document.getElementById("authBtn").textContent="Sign in";document.getElementById("authBtn").onclick=openAuth;updateDashboard()}
window.showCareer=showCareer;window.saveCareer=saveCareer;window.removeCareer=removeCareer;window.openOpportunityForm=openOpportunityForm;
document.getElementById("menuBtn").onclick=()=>document.getElementById("nav").classList.toggle("show");
document.getElementById("authBtn").onclick=token?logout:openAuth;
document.getElementById("closeModal").onclick=closeModal;
document.getElementById("modal").onclick=e=>{if(e.target.id==="modal")closeModal()};
document.getElementById("search").oninput=renderCareers;document.getElementById("category").onchange=renderCareers;
(async()=>{renderQuiz();renderSubjects();await loadCareers();await loadOpportunities();await updateDashboard()})().catch(console.error);
