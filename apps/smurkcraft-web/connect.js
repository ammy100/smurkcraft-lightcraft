import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://uatfeythunqazseislgr.supabase.co";
const SUPABASE_KEY = "sb_publishable_ENgKWTArcMOg1GuaUlyDrg_ekT07PoZ";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

const $ = (sel, root = document) => root.querySelector(sel);
const escapeHtml = (v = "") => String(v).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const time = v => new Date(v).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
const date = v => new Date(v).toLocaleDateString([], {month:"short",day:"numeric"});
let session = null, activeConversation = null, realtime = null, activeTab = "chats", messages = [];

function mount() {
  if ($("#smurk-connect-launcher")) return;
  const launcher = document.createElement("button");
  launcher.id = "smurk-connect-launcher";
  launcher.setAttribute("aria-label", "Open Smurkcraft Connect");
  launcher.innerHTML = '<span class="sc-launch-icon">✳</span><span>Connect</span>';
  document.body.append(launcher);
  const panel = document.createElement("aside");
  panel.id = "smurk-connect";
  panel.className = "sc-hidden";
  panel.innerHTML = `
    <header class="sc-top"><div class="sc-brand"><div class="sc-mark">S</div><div><strong>Smurkcraft Connect</strong><small id="sc-subtitle">Your creative space</small></div></div><button id="sc-close" class="sc-icon" aria-label="Close">×</button></header>
    <section id="sc-auth" class="sc-auth">
      <div class="sc-orb">✳</div><h2>Make good work.<br><span>Stay connected.</span></h2><p>Message other creators, get product updates and talk to your editing assistant.</p>
      <form id="sc-auth-form"><label>Email<input name="email" type="email" autocomplete="email" required placeholder="you@example.com"></label><label>Password<input name="password" type="password" autocomplete="current-password" minlength="6" required placeholder="At least 6 characters"></label><button class="sc-primary" type="submit" id="sc-auth-submit">Sign in</button></form>
      <button id="sc-google" class="sc-secondary">Continue with Google ↗</button><button id="sc-auth-mode" class="sc-link">New here? Create an account</button><p class="sc-note">Your photo library stays local. Connect uses the internet for account and messaging features.</p>
    </section>
    <section id="sc-app" class="sc-hidden">
      <div class="sc-account"><div class="sc-avatar" id="sc-avatar">S</div><div class="sc-account-copy"><strong id="sc-user-name">Creator</strong><small id="sc-user-email"></small></div><button id="sc-profile-toggle" class="sc-link">Profile</button><button id="sc-signout" class="sc-link">Sign out</button></div>
      <form id="sc-profile-form" class="sc-profile-form sc-hidden"><label>Creator username <input id="sc-profile-username" minlength="3" maxlength="32" pattern="[A-Za-z0-9_]+" placeholder="yourname" required></label><button class="sc-primary" type="submit">Save username</button><p class="sc-note">Other creators can find you using this username.</p></form>
      <nav class="sc-tabs"><button data-tab="chats" class="sc-tab sc-selected">Chats</button><button data-tab="assistant" class="sc-tab">Smurk AI</button><button data-tab="updates" class="sc-tab">Updates <i id="sc-update-dot"></i></button></nav>
      <div id="sc-chats" class="sc-view"><div class="sc-section-title"><div><h3>Messages</h3><p>Keep your creative circle close.</p></div><button id="sc-new-chat" class="sc-round" title="Start a conversation">＋</button></div><div id="sc-chat-list" class="sc-list"></div><div id="sc-new-chat-form" class="sc-new-chat sc-hidden"><label>Start a chat by username<input id="sc-username" placeholder="creatorname"></label><button id="sc-start-chat" class="sc-primary">Start chat</button></div><div id="sc-thread" class="sc-thread sc-hidden"><button id="sc-back" class="sc-back">← All chats</button><div class="sc-thread-title" id="sc-thread-title">Conversation</div><div id="sc-message-list" class="sc-message-list"></div><form id="sc-send-form" class="sc-send"><input id="sc-message-input" maxlength="10000" autocomplete="off" placeholder="Write a message…" required><button class="sc-send-btn" aria-label="Send message">↑</button></form></div></div>
      <div id="sc-assistant" class="sc-view sc-hidden"><div class="sc-section-title"><div><h3>Smurk AI</h3><p>Creative help, without the noise.</p></div><span class="sc-local-badge">LOCAL TIPS</span></div><div id="sc-ai-log" class="sc-ai-log"><div class="sc-ai-bubble"><b>Hey, creator 👋</b><br>I can help plan an edit, suggest colour grades, explain tools and build a workflow. Your actual photo adjustments remain in Smurkcraft.</div><div class="sc-prompts"><button data-prompt="Suggest a cinematic portrait edit">Cinematic portrait</button><button data-prompt="Help me choose colours for a campaign">Campaign colours</button><button data-prompt="Give me a clean photo editing workflow">Editing workflow</button></div></div><form id="sc-ai-form" class="sc-send"><input id="sc-ai-input" autocomplete="off" placeholder="Ask your creative assistant…" required><button class="sc-send-btn" aria-label="Send">↑</button></form><p class="sc-note">This starter assistant runs lightweight local guidance. It does not yet apply edits automatically.</p></div>
      <div id="sc-updates" class="sc-view sc-hidden"><div class="sc-section-title"><div><h3>Smurk Broadcast</h3><p>News and updates from the team.</p></div></div><div id="sc-announcements" class="sc-list"></div></div>
    </section>
    <div id="sc-toast" role="status" aria-live="polite"></div>`;
  document.body.append(panel);
  launcher.addEventListener("click", () => { panel.classList.toggle("sc-hidden"); launcher.classList.toggle("sc-open", !panel.classList.contains("sc-hidden")); });
  $("#sc-close").onclick = () => { panel.classList.add("sc-hidden"); launcher.classList.remove("sc-open"); };
  $("#sc-auth-mode").onclick = () => { const signup = $("#sc-auth-submit").dataset.mode !== "signup"; $("#sc-auth-submit").dataset.mode = signup ? "signup" : "signin"; $("#sc-auth-submit").textContent = signup ? "Create account" : "Sign in"; $("#sc-auth-mode").textContent = signup ? "Already have an account? Sign in" : "New here? Create an account"; };
  $("#sc-auth-form").addEventListener("submit", authWithEmail);
  $("#sc-google").onclick = async () => { const { error } = await supabase.auth.signInWithOAuth({provider:"google", options:{redirectTo:location.href.split("#")[0]}}); if (error) toast(error.message); };
  $("#sc-signout").onclick = async () => { await supabase.auth.signOut(); };
  $("#sc-profile-toggle").onclick = () => $("#sc-profile-form").classList.toggle("sc-hidden");
  $("#sc-profile-form").addEventListener("submit", saveUsername);
  document.querySelectorAll(".sc-tab").forEach(b => b.onclick = () => switchTab(b.dataset.tab));
  $("#sc-new-chat").onclick = () => $("#sc-new-chat-form").classList.toggle("sc-hidden");
  $("#sc-start-chat").onclick = startChat;
  $("#sc-back").onclick = () => { activeConversation = null; if (realtime) { supabase.removeChannel(realtime); realtime = null; } $("#sc-thread").classList.add("sc-hidden"); $("#sc-chat-list").classList.remove("sc-hidden"); };
  $("#sc-send-form").addEventListener("submit", sendMessage);
  $("#sc-ai-form").addEventListener("submit", sendAi);
  document.querySelectorAll("[data-prompt]").forEach(b => b.onclick = () => { $("#sc-ai-input").value = b.dataset.prompt; $("#sc-ai-form").requestSubmit(); });
  supabase.auth.onAuthStateChange((_event, nextSession) => { session = nextSession; queueMicrotask(() => renderAuth()); });
  supabase.auth.getSession().then(({data}) => { session = data.session; renderAuth(); });
}
function toast(message) { const el=$("#sc-toast"); if(!el) return; el.textContent=message; el.classList.add("sc-toast-on"); setTimeout(()=>el.classList.remove("sc-toast-on"),3400); }
async function authWithEmail(e) {
  e.preventDefault(); const form = new FormData(e.currentTarget), email=String(form.get("email")).trim(), password=String(form.get("password"));
  const signup=$("#sc-auth-submit").dataset.mode==="signup"; $("#sc-auth-submit").disabled=true;
  try {
    const result = signup ? await supabase.auth.signUp({email,password,options:{data:{display_name:email.split("@")[0]}}}) : await supabase.auth.signInWithPassword({email,password});
    if(result.error) throw result.error;
    if(signup && !result.data.session) toast("Account created. Check your email to confirm, then sign in.");
  } catch(err) { toast(err.message || "Authentication failed."); }
  finally { $("#sc-auth-submit").disabled=false; }
}
async function renderAuth() {
  if (!$("#sc-auth")) return;
  $("#sc-auth").classList.toggle("sc-hidden", !!session);
  $("#sc-app").classList.toggle("sc-hidden", !session);
  $("#sc-subtitle").textContent = session ? "Connected to your creative circle" : "Your creative space";
  if (!session) { if(realtime) { await supabase.removeChannel(realtime); realtime=null; } return; }
  const user=session.user, meta=user.user_metadata||{};
  $("#sc-user-email").textContent=user.email||"Signed in";
  const {data:profile}=await supabase.from("connect_profiles").select("*").eq("user_id",user.id).maybeSingle();
  const displayName=profile?.display_name||meta.display_name||meta.full_name||user.email?.split("@")[0]||"Creator";
  $("#sc-user-name").textContent=displayName; $("#sc-avatar").textContent=displayName.slice(0,1).toUpperCase();
  $("#sc-profile-username").value=profile?.username||"";
  await supabase.from("connect_profiles").upsert({user_id:user.id,username:profile?.username||null,display_name:displayName,avatar_url:meta.avatar_url||meta.picture||profile?.avatar_url||null},{onConflict:"user_id"});
  await Promise.all([loadConversations(),loadAnnouncements()]);
  if(!realtime) realtime=supabase.channel("smurk-connect-global").on("postgres_changes",{event:"INSERT",schema:"public",table:"connect_messages"},payload=>{ if(activeConversation && payload.new.conversation_id===activeConversation) loadMessages(activeConversation); else loadConversations(); }).on("postgres_changes",{event:"INSERT",schema:"public",table:"connect_announcements"},()=>loadAnnouncements()).subscribe();
}
function switchTab(tab) {
  activeTab=tab; document.querySelectorAll(".sc-tab").forEach(b=>b.classList.toggle("sc-selected",b.dataset.tab===tab));
  ["chats","assistant","updates"].forEach(name=>$("#sc-"+name).classList.toggle("sc-hidden",name!==tab));
  if(tab==="updates") loadAnnouncements();
}
async function saveUsername(e) {
  e.preventDefault();
  const username=$("#sc-profile-username").value.trim().replace(/^@/,"").toLowerCase();
  if(!/^[a-z0-9_]{3,32}$/.test(username)) return toast("Use 3–32 letters, numbers or underscores.");
  const {error}=await supabase.from("connect_profiles").upsert({user_id:session.user.id,username,display_name:$("#sc-user-name").textContent},{onConflict:"user_id"});
  if(error) return toast(error.code==="23505"?"That username is already taken.":error.message);
  toast("Username saved. Creators can now find you."); $("#sc-profile-form").classList.add("sc-hidden");
}
async function loadConversations() {
  const list=$("#sc-chat-list"); if(!session||!list) return;
  const {data:members,error}=await supabase.from("connect_conversation_members").select("conversation_id,role").eq("user_id",session.user.id);
  if(error) { list.innerHTML='<div class="sc-empty">Could not load chats. Check your Supabase policies.</div>'; return; }
  if(!members?.length) { list.innerHTML='<div class="sc-empty"><span>✉</span><b>Your next creative conversation starts here.</b><p>Use ＋ and enter another creator’s username.</p></div>'; return; }
  const ids=members.map(m=>m.conversation_id);
  const [{data:convs},{data:msgs},{data:allMembers}]=await Promise.all([
    supabase.from("connect_conversations").select("*").in("id",ids).order("updated_at",{ascending:false}),
    supabase.from("connect_messages").select("conversation_id,body,created_at").in("conversation_id",ids).order("created_at",{ascending:false}),
    supabase.from("connect_conversation_members").select("conversation_id,user_id").in("conversation_id",ids)
  ]);
  const otherIds=[...new Set((allMembers||[]).map(m=>m.user_id).filter(id=>id!==session.user.id))];
  const {data:profiles}=otherIds.length?await supabase.from("connect_profiles").select("user_id,username,display_name").in("user_id",otherIds):{data:[]};
  list.innerHTML=(convs||[]).map(c=>{const other=(allMembers||[]).find(m=>m.conversation_id===c.id&&m.user_id!==session.user.id);const p=(profiles||[]).find(p=>p.user_id===other?.user_id);const latest=(msgs||[]).find(m=>m.conversation_id===c.id);const title=c.title||p?.display_name||p?.username||"Conversation";return `<button class="sc-chat-row" data-conversation="${c.id}"><span class="sc-chat-avatar">${escapeHtml(title.slice(0,1).toUpperCase())}</span><span class="sc-chat-copy"><b>${escapeHtml(title)}</b><small>${escapeHtml(latest?.body||"Start a conversation")}</small></span><time>${latest?time(latest.created_at):date(c.created_at)}</time></button>`;}).join("")||'<div class="sc-empty">No conversations yet.</div>';
  list.querySelectorAll("[data-conversation]").forEach(b=>b.onclick=()=>openConversation(b.dataset.conversation,b.querySelector("b").textContent));
}
async function startChat() {
  const username=$("#sc-username").value.trim().replace(/^@/,"").toLowerCase(); if(username.length<3) return toast("Enter a username with at least 3 characters.");
  const {data:person,error}=await supabase.from("connect_profiles").select("user_id,username,display_name").eq("username",username).maybeSingle();
  if(error||!person) return toast("Creator not found. They need to create a profile and choose a username first.");
  if(person.user_id===session.user.id) return toast("You can't start a chat with yourself.");
  const {data:mine}=await supabase.from("connect_conversation_members").select("conversation_id").eq("user_id",session.user.id);
  const ids=(mine||[]).map(x=>x.conversation_id);
  if(ids.length){const {data:theirs}=await supabase.from("connect_conversation_members").select("conversation_id").eq("user_id",person.user_id).in("conversation_id",ids);if(theirs?.length){const {data:c}=await supabase.from("connect_conversations").select("id").eq("id",theirs[0].conversation_id).maybeSingle();if(c){$("#sc-new-chat-form").classList.add("sc-hidden");return openConversation(c.id,person.display_name||person.username);}}}
  const {data:conv,error:convErr}=await supabase.from("connect_conversations").insert({created_by:session.user.id,is_group:false}).select("id").single();
  if(convErr) return toast(convErr.message);
  const {error:ownerErr}=await supabase.from("connect_conversation_members").insert({conversation_id:conv.id,user_id:session.user.id,role:"owner"});
  if(ownerErr) { await supabase.from("connect_conversations").delete().eq("id",conv.id); return toast(ownerErr.message); }
  const {error:memberErr}=await supabase.from("connect_conversation_members").insert({conversation_id:conv.id,user_id:person.user_id,role:"member"});
  if(memberErr) { await supabase.from("connect_conversation_members").delete().eq("conversation_id",conv.id); await supabase.from("connect_conversations").delete().eq("id",conv.id); return toast(memberErr.message); }
  $("#sc-new-chat-form").classList.add("sc-hidden"); $("#sc-username").value=""; await loadConversations(); openConversation(conv.id,person.display_name||person.username);
}
async function openConversation(id,title) {
  activeConversation=id; $("#sc-thread-title").textContent=title; $("#sc-chat-list").classList.add("sc-hidden"); $("#sc-new-chat-form").classList.add("sc-hidden"); $("#sc-thread").classList.remove("sc-hidden"); await loadMessages(id);
}
async function loadMessages(id) {
  const {data,error}=await supabase.from("connect_messages").select("*").eq("conversation_id",id).is("deleted_at",null).order("created_at",{ascending:true}).limit(300);
  if(error) return toast("Couldn't load messages: "+error.message);
  messages=data||[]; const list=$("#sc-message-list");
  list.innerHTML=messages.map(m=>`<div class="sc-message ${m.sender_id===session.user.id?"sc-mine":""}"><div>${escapeHtml(m.body)}</div><time>${time(m.created_at)}</time></div>`).join("")||'<div class="sc-empty">Say hello to start the conversation 👋</div>';
  list.scrollTop=list.scrollHeight;
}
async function sendMessage(e) {
  e.preventDefault(); const input=$("#sc-message-input"),body=input.value.trim(); if(!body||!activeConversation)return;
  input.disabled=true; const {error}=await supabase.from("connect_messages").insert({conversation_id:activeConversation,body});
  input.disabled=false; if(error) return toast(error.message); input.value=""; await loadMessages(activeConversation); await loadConversations();
}
async function loadAnnouncements() {
  if(!session)return; const box=$("#sc-announcements");
  const {data,error}=await supabase.from("connect_announcements").select("*").eq("published",true).order("published_at",{ascending:false}).limit(50);
  if(error) {box.innerHTML='<div class="sc-empty">Could not load updates.</div>';return;}
  const announcements=data||[];
  const {data:receipts}=announcements.length?await supabase.from("connect_announcement_reads").select("announcement_id").eq("user_id",session.user.id).in("announcement_id",announcements.map(a=>a.id)):{data:[]};
  const readIds=new Set((receipts||[]).map(r=>r.announcement_id));
  const unread=announcements.filter(a=>!readIds.has(a.id));
  $("#sc-update-dot").style.display=unread.length?"inline-block":"none";
  $("#sc-update-dot").title=unread.length?unread.length+" unread updates":"";
  box.innerHTML=announcements.map(a=>`<article class="sc-announcement sc-${escapeHtml(a.severity)} ${readIds.has(a.id)?"":"sc-unread"}"><small>${readIds.has(a.id)?"":"● NEW · "}${escapeHtml(a.severity.toUpperCase())} · ${date(a.published_at||a.created_at)}</small><h4>${escapeHtml(a.title)}</h4><p>${escapeHtml(a.body).replace(/\n/g,"<br>")}</p></article>`).join("")||'<div class="sc-empty"><span>✳</span><b>You're all caught up.</b><p>Product news and release notes will appear here.</p></div>';
  if(activeTab==="updates" && unread.length) {
    const {error:readError}=await supabase.from("connect_announcement_reads").upsert(unread.map(a=>({announcement_id:a.id,user_id:session.user.id})),{onConflict:"announcement_id,user_id",ignoreDuplicates:true});
    if(!readError) { $("#sc-update-dot").style.display="none"; box.querySelectorAll(".sc-unread").forEach(el=>{el.classList.remove("sc-unread");const small=el.querySelector("small");if(small)small.textContent=small.textContent.replace("● NEW · ","");}); }
  }
}
function localAssistant(text) {
  const t=text.toLowerCase();
  if(/cinematic|movie|film|portrait/.test(t)) return "Try this as a starting point:\n1. Set exposure and white balance first.\n2. Protect skin highlights; gently lower bright highlights.\n3. Add a soft S-curve with lifted blacks only if the mood needs it.\n4. Keep skin tones natural; use a restrained teal/amber split rather than pushing every shadow blue.\n5. Finish with subtle grain and check the image at 100%.\n\nThese are suggestions only—I haven't changed your photo.";
  if(/colour|color|palette|campaign|brand/.test(t)) return "A balanced campaign palette could be: deep ink #171923, electric violet #8B5CF6, warm cream #F5F1E8 and signal lime #C8F169. Use ink for structure, cream for breathing room, violet as the hero accent and lime sparingly for calls to action. Check contrast before exporting.";
  if(/workflow|edit|editing|photo/.test(t)) return "A dependable non-destructive workflow:\n1. Import and cull before editing.\n2. Correct lens, white balance and exposure.\n3. Recover highlights and open shadows carefully.\n4. Set contrast and tone curve.\n5. Tune colour, then local adjustments.\n6. Apply noise reduction and sharpening at final output size.\n7. Compare before/after and export a copy.\n\nTell me the photo type and mood for a more tailored recipe.";
  if(/help|what can|hello|hey/.test(t)) return "I can help plan photo edits, explain colour and tone controls, suggest visual directions, create editing checklists and troubleshoot workflows. Tell me what you're working on and the result you want.";
  return "Let's shape that into a clear creative direction. What are you editing (portrait, product, landscape or campaign image), and what mood do you want? I can suggest a practical workflow and values to try. This starter assistant runs locally in your browser; it doesn't call a paid AI service or modify the image directly.";
}
function sendAi(e) {
  e.preventDefault(); const input=$("#sc-ai-input"),value=input.value.trim(); if(!value)return;
  const log=$("#sc-ai-log"),user=document.createElement("div"); user.className="sc-ai-user"; user.textContent=value; log.append(user);
  const answer=document.createElement("div"); answer.className="sc-ai-bubble"; answer.textContent=localAssistant(value); log.append(answer); input.value=""; log.scrollTop=log.scrollHeight;
}
mount();
