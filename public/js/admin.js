const els = {
  back: document.getElementById('back'),
  logout: document.getElementById('logout'),
  demoBanner: document.getElementById('demo-banner'),
  usersTbody: document.getElementById('users-tbody'),
  usersRefresh: document.getElementById('users-refresh'),
  usersLoading: document.getElementById('users-loading'),
  toast: document.getElementById('toast'),
  // modals
  uOpen: document.getElementById('u-open'),
  uModal: document.getElementById('u-modal'),
  uClose: document.getElementById('u-close'),
  uCancel: document.getElementById('u-cancel'),
  uCreate: document.getElementById('u-create'),
  uName: document.getElementById('u-name'),
  uPass: document.getElementById('u-pass'),
  uRole: document.getElementById('u-role'),

  aOpen: document.getElementById('a-open'),
  aModal: document.getElementById('a-modal'),
  aClose: document.getElementById('a-close'),
  aCancel: document.getElementById('a-cancel'),
  aAssign: document.getElementById('a-assign'),
  aName: document.getElementById('a-name'),
  aMail: document.getElementById('a-mail'),

  dInput: document.getElementById('d-input'),
  dAdd: document.getElementById('d-add'),
  dRefresh: document.getElementById('d-refresh'),
  dCount: document.getElementById('d-count'),
  domainsList: document.getElementById('domains-list'),
  domainsLoading: document.getElementById('domains-loading'),

  userMailboxes: document.getElementById('user-mailboxes'),
  userMailboxesLoading: document.getElementById('user-mailboxes-loading'),
  // edit modal
  editModal: document.getElementById('edit-modal'),
  editClose: document.getElementById('edit-close'),
  editCancel: document.getElementById('edit-cancel'),
  editSave: document.getElementById('edit-save'),
  editRefresh: document.getElementById('edit-refresh'),
  editName: document.getElementById('edit-name'),
  editUserDisplay: document.getElementById('edit-user-display'),
  editNewName: document.getElementById('edit-new-name'),
  editRoleCheck: document.getElementById('edit-role-check'),
  editLimit: document.getElementById('edit-limit'),
  editSendCheck: document.getElementById('edit-send-check'),
  editPass: document.getElementById('edit-pass'),
  editClearMailboxes: document.getElementById('edit-clear-mailboxes'),
  editDelete: document.getElementById('edit-delete'),
  adminConfirmModal: document.getElementById('admin-confirm-modal'),
  adminConfirmClose: document.getElementById('admin-confirm-close'),
  adminConfirmCancel: document.getElementById('admin-confirm-cancel'),
  adminConfirmOk: document.getElementById('admin-confirm-ok'),
  adminConfirmMessage: document.getElementById('admin-confirm-message')
};

function formatTs(ts){
  if (!ts) return '';
  try{
    const iso = ts.includes('T') ? ts.replace(' ', 'T') : ts.replace(' ', 'T');
    const d = new Date(iso + 'Z');
    return new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai',
      hour12: false,
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).format(d);
  }catch(_){ return ts; }
}

async function showToast(message, type='info'){
  try{
    const res = await fetch('/templates/toast.html', { cache: 'no-cache' });
    const tpl = await res.text();
    const html = tpl.replace('{{type}}', String(type||'info')).replace('{{message}}', String(message||''));
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    const styleEl = wrapper.querySelector('#toast-style');
    if (styleEl && !document.getElementById('toast-style')){
      document.head.appendChild(styleEl);
    }
    const toastEl = wrapper.querySelector('.toast-item');
    if (toastEl){
      els.toast.appendChild(toastEl);
      setTimeout(()=>{ 
        toastEl.style.transition='opacity .3s'; 
        toastEl.style.opacity='0'; 
        setTimeout(()=>toastEl.remove(),300); 
      }, 1600);
    }
  }catch(_){
    const div = document.createElement('div');
    div.className = `toast-item ${type}`;
    div.textContent = message;
    els.toast.appendChild(div);
    setTimeout(()=>{ div.style.transition='opacity .3s'; div.style.opacity='0'; setTimeout(()=>div.remove(), 300); }, 1600);
  }
}

// 公用复制
window.copyText = async (text) => {
  try{ await navigator.clipboard.writeText(String(text||'')); showToast('已复制到剪贴板','success'); }
  catch(_){ showToast('复制失败','warn'); }
}

function openAdminConfirm(message, onOk){
  try{
    els.adminConfirmMessage.textContent = message || '确认执行该操作？';
    els.adminConfirmModal.classList.add('show');
    const closeIt = () => els.adminConfirmModal.classList.remove('show');
    els.adminConfirmCancel.onclick = closeIt;
    els.adminConfirmClose.onclick = closeIt;
    els.adminConfirmOk.onclick = async () => { 
      try{ 
        setButtonLoading(els.adminConfirmOk, '处理中…');
        await onOk?.(); 
      } finally { 
        try{ restoreButton(els.adminConfirmOk); }catch(_){ }
        closeIt(); 
      } 
    };
  }catch(_){ if (confirm(message||'确认执行该操作？')) onOk?.(); }
}

async function api(path, options){
  const r = await fetch(path, options);
  if (r.status === 401){ location.replace('/html/login.html'); throw new Error('unauthorized'); }
  return r;
}

function openModal(m){ m?.classList?.add('show'); }
function closeModal(m){ m?.classList?.remove('show'); }

let __domainsCache = [];
let __canManageDomains = false;

function normalizeDomainInput(input){
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, '')
    .replace(/^@+/, '')
    .replace(/\/+.*$/, '')
    .replace(/\.+$/, '');
}

function renderDomains(domains){
  const list = Array.isArray(domains) ? domains : [];
  __domainsCache = list;
  if (els.dCount) els.dCount.textContent = String(list.length);
  if (!els.domainsList) return;
  if (!list.length){
    els.domainsList.innerHTML = '<div class="domain-empty">暂无可用域名</div>';
    return;
  }
  els.domainsList.innerHTML = '';
  list.forEach((domain) => {
    const row = document.createElement('div');
    row.className = 'domain-item';

    const text = document.createElement('span');
    text.className = 'domain-text';
    text.textContent = domain;

    const actions = document.createElement('div');
    actions.className = 'domain-actions';

    const copyBtn = document.createElement('button');
    copyBtn.className = 'btn btn-ghost btn-sm';
    copyBtn.type = 'button';
    copyBtn.textContent = '复制';
    copyBtn.onclick = () => copyText(domain);

    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn-danger btn-sm';
    delBtn.type = 'button';
    delBtn.textContent = '删除';
    delBtn.disabled = !__canManageDomains || list.length <= 1;
    delBtn.title = !__canManageDomains
      ? '仅严格管理员可删除域名'
      : (list.length <= 1 ? '至少保留一个域名' : '删除该域名');
    delBtn.onclick = () => {
      openAdminConfirm(`确认删除域名 ${domain} 吗？`, async () => {
        try{
          const r = await api(`/api/domains?domain=${encodeURIComponent(domain)}`, { method:'DELETE' });
          if (!r.ok){ const t = await r.text(); throw new Error(t || '删除失败'); }
          showToast('域名已删除', 'success');
          await loadDomains();
        }catch(e){
          showToast('删除失败：' + (e?.message || e), 'warn');
        }
      });
    };

    actions.appendChild(copyBtn);
    actions.appendChild(delBtn);
    row.appendChild(text);
    row.appendChild(actions);
    els.domainsList.appendChild(row);
  });
}

async function loadDomains(){
  try{
    if (els.domainsLoading) els.domainsLoading.style.display = 'inline-flex';
    const r = await api('/api/domains');
    const list = await r.json();
    renderDomains(Array.isArray(list) ? list : []);
  }catch(e){
    if (els.domainsList) els.domainsList.innerHTML = '<div class="domain-empty" style="color:#dc2626">加载域名失败</div>';
  }finally{
    if (els.domainsLoading) els.domainsLoading.style.display = 'none';
  }
}

async function createDomain(){
  if (!__canManageDomains){ showToast('仅严格管理员可管理域名', 'warn'); return; }
  const raw = els.dInput?.value || '';
  const domain = normalizeDomainInput(raw);
  if (!domain){ showToast('请输入域名', 'warn'); return; }
  const validDomain = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])$/.test(domain);
  if (!validDomain){ showToast('域名格式不正确', 'warn'); return; }
  if (__domainsCache.includes(domain)){ showToast('域名已存在', 'warn'); return; }
  try{
    if (els.dInput) els.dInput.value = domain;
    setButtonLoading(els.dAdd, '添加中…');
    const r = await api('/api/domains', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain })
    });
    if (!r.ok){ const t = await r.text(); throw new Error(t || '添加失败'); }
    showToast('域名已添加', 'success');
    if (els.dInput) els.dInput.value = '';
    await loadDomains();
  }catch(e){
    showToast('添加失败：' + (e?.message || e), 'warn');
  }finally{
    restoreButton(els.dAdd);
  }
}

async function loadUsers(){
  try{
    if (els.usersLoading){ els.usersLoading.style.display = 'inline-flex'; }
    const r = await api('/api/users');
    const users = await r.json();
    els.usersTbody.innerHTML = (users||[]).map(u => `
      <tr>
        <td>${u.id}</td>
        <td>${u.username}</td>
        <td>${u.role === 'admin' ? '高级用户' : '普通用户'}</td>
        <td>${u.mailbox_count || 0} / <span class="badge">${u.mailbox_limit}</span></td>
        <td>${u.can_send ? '是' : '否'}</td>
        <td>${formatTs(u.created_at)}</td>
        <td>
          <div class="user-actions">
            <button class="btn btn-ghost btn-sm" onclick="viewUserMailboxes(this, ${u.id}, '${u.username}')">邮箱</button>
            <button class="btn btn-secondary btn-sm" onclick="openEdit(${u.id}, '${u.username}', '${u.role}', ${u.mailbox_limit}, ${u.can_send?1:0})">编辑</button>
          </div>
        </td>
      </tr>
    `).join('');
  }catch(e){ els.usersTbody.innerHTML = '<tr><td colspan="7" style="color:#dc2626">加载失败</td></tr>'; }
  finally { if (els.usersLoading){ els.usersLoading.style.display = 'none'; } }
}

window.viewUserMailboxes = async (a, b, c) => {
  try{
    let btn = null, userId = a, username = b;
    if (a && typeof a === 'object' && a.tagName){ btn = a; userId = b; username = c; }
    if (btn) setButtonLoading(btn, '加载中…');
    if (els.userMailboxesLoading){ els.userMailboxesLoading.style.display = 'inline-flex'; }
    const r = await api(`/api/users/${userId}/mailboxes`);
    const list = await r.json();
    els.userMailboxes.innerHTML = `<div style="margin-bottom:8px">用户 <strong>${username}</strong> 的邮箱：</div>` +
      `<div class="user-mailboxes">` +
      (list||[]).map(x => `
        <div class="user-mailbox-item">
          <div class="mailbox-tooltip">
            <span>${x.address}</span>
            <button class="btn btn-ghost btn-sm" onclick="copyText('${x.address}')">复制</button>
          </div>
          <span class="addr" title="${x.address}">${x.address}</span>
          <span class="time">${formatTs(x.created_at)}</span>
        </div>
      `).join('') + `</div>`;
  }catch(_){ showToast('加载用户邮箱失败','warn'); }
  finally { 
    if (els.userMailboxesLoading){ els.userMailboxesLoading.style.display = 'none'; }
    if (btn) restoreButton(btn);
  }
}

window.promptSetLimit = async (userId, current) => {
  const v = prompt('设置邮箱上限（整数）：', String(current || 10));
  if (v === null) return;
  const n = Math.max(0, parseInt(v, 10) || 0);
  try{
    const r = await api(`/api/users/${userId}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ mailboxLimit: n }) });
    if (!r.ok){ const t = await r.text(); throw new Error(t); }
    showToast('已更新上限','success');
    loadUsers();
  }catch(e){ showToast('更新失败：' + (e?.message||e), 'warn'); }
}

window.deleteUser = async (userId) => {
  try{
    const r = await api(`/api/users/${userId}`, { method:'DELETE' });
    if (!r.ok){ const t = await r.text(); throw new Error(t); }
    showToast('已删除用户','success');
    els.userMailboxes.innerHTML = '';
    loadUsers();
  }catch(e){ showToast('删除失败：' + (e?.message||e), 'warn'); }
}

window.clearUserMailboxData = async (userId, username = '') => {
  try{
    const r = await api(`/api/users/${userId}/mailboxes/clear`, { method:'POST' });
    if (!r.ok){ const t = await r.text(); throw new Error(t); }
    const data = await r.json().catch(()=>({}));
    const clearedBindings = Number(data?.clearedBindings || 0);
    const deletedMailboxes = Number(data?.deletedMailboxes || 0);
    const deletedMessages = Number(data?.deletedMessages || 0);
    const deletedSentRecords = Number(data?.deletedSentRecords || 0);
    const skippedShared = Number(data?.skippedSharedMailboxes || 0);
    showToast(
      `已清空${username ? ` ${username}` : ''}：解绑${clearedBindings}、删邮箱${deletedMailboxes}、删邮件${deletedMessages}、删发件${deletedSentRecords}${skippedShared>0 ? `（${skippedShared}个共享邮箱已跳过）` : ''}`,
      'success'
    );
    if (els.userMailboxes){
      els.userMailboxes.innerHTML = username
        ? `<div style="margin-bottom:8px">用户 <strong>${username}</strong> 的邮箱：</div><div class="domain-empty">暂无已绑定邮箱</div>`
        : '';
    }
    loadUsers();
  }catch(e){
    showToast('清空失败：' + (e?.message||e), 'warn');
  }
}

// 切换发件权限
window.toggleSend = async (userId, current) => {
  const next = current ? 0 : 1;
  try{
    const r = await api(`/api/users/${userId}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ can_send: next }) });
    if (!r.ok){ const t = await r.text(); throw new Error(t); }
    showToast(next ? '已允许该用户发件' : '已禁止该用户发件', 'success');
    loadUsers();
  }catch(e){ showToast('操作失败：' + (e?.message||e), 'warn'); }
}

// 创建用户
function resetCreateForm(){ els.uName.value=''; els.uPass.value=''; els.uRole.value='user'; }
els.uOpen.onclick = () => { resetCreateForm(); openModal(els.uModal); };
els.uClose.onclick = () => closeModal(els.uModal);
els.uCancel.onclick = () => closeModal(els.uModal);
els.uCreate.onclick = async () => {
  const username = els.uName.value.trim();
  const password = els.uPass.value.trim();
  const role = els.uRole.value;
  if (!username){ showToast('请输入用户名','warn'); return; }
  try{
    setButtonLoading(els.uCreate, '创建中…');
    const r = await api('/api/users', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ username, password, role }) });
    if (!r.ok){ const t = await r.text(); throw new Error(t); }
    showToast('创建成功','success');
    closeModal(els.uModal);
    loadUsers();
  }catch(e){ showToast('创建失败：' + (e?.message||e), 'warn'); }
  finally { restoreButton(els.uCreate); }
}

// 分配邮箱
els.aOpen.onclick = () => openModal(els.aModal);
els.aClose.onclick = () => closeModal(els.aModal);
els.aCancel.onclick = () => closeModal(els.aModal);
els.aAssign.onclick = async () => {
  const username = els.aName.value.trim();
  const addresses = els.aMail.value.trim().split('\n').map(addr => addr.trim()).filter(addr => addr);
  
  if (!username || addresses.length === 0){
    showToast('请输入用户名和至少一个邮箱地址','warn'); 
    return; 
  }
  
  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const invalidEmails = addresses.filter(addr => !emailRegex.test(addr));
  if (invalidEmails.length > 0) {
    showToast(`邮箱格式错误：${invalidEmails.join(', ')}`,'warn');
    return;
  }
  
  try{
    setButtonLoading(els.aAssign, '正在分配…');
    let successCount = 0;
    let failCount = 0;
    
    for (const address of addresses) {
      try {
        const r = await api('/api/users/assign', { 
          method:'POST', 
          headers:{'Content-Type':'application/json'}, 
          body: JSON.stringify({ username, address: address.toLowerCase() }) 
        });
        if (r.ok) {
          successCount++;
        } else {
          const txt = await r.text();
          console.error(`分配邮箱 ${address} 失败:`, txt);
          failCount++;
        }
      } catch (e) {
        console.error(`分配邮箱 ${address} 异常:`, e);
        failCount++;
      }
    }
    
    if (successCount > 0) {
      showToast(`成功分配 ${successCount} 个邮箱${failCount > 0 ? `，${failCount} 个失败` : ''}`,'success');
      closeModal(els.aModal);
      loadUsers();
    } else {
      showToast('所有邮箱分配失败','warn');
    }
  }catch(e){ 
    showToast('分配失败：' + (e?.message||e), 'warn'); 
  }
  finally { restoreButton(els.aAssign); }
}

// 统一按钮加载态（与 app.js 一致的极简实现）
function setButtonLoading(button, text){
  if (!button) return;
  if (button.dataset.loading === '1') return;
  button.dataset.loading = '1';
  button.dataset.originalHtml = button.innerHTML;
  button.disabled = true;
  const txt = text || '处理中…';
  button.innerHTML = `<div class="spinner"></div><span style="margin-left:8px">${txt}</span>`;
}
function restoreButton(button){
  if (!button) return;
  const html = button.dataset.originalHtml;
  if (html){ button.innerHTML = html; }
  button.disabled = false;
  delete button.dataset.loading;
  delete button.dataset.originalHtml;
}

// 导航
els.back.onclick = () => { location.replace('/templates/loading.html?redirect=%2F&status=' + encodeURIComponent('正在返回首页…')); };
els.logout.onclick = async () => { 
  try{ fetch('/api/logout', { method:'POST', keepalive: true }); }catch{}
  try{ sessionStorage.setItem('mf:just_logged_out', '1'); }catch(_){ }
  location.replace('/html/login.html?from=logout');
};

// 加载
els.usersRefresh.onclick = async () => { if (els.usersLoading){ els.usersLoading.style.display = 'inline-flex'; } await loadUsers(); };
loadUsers();
if (els.dInput) els.dInput.disabled = true;
if (els.dAdd) {
  els.dAdd.disabled = true;
  els.dAdd.title = '正在校验域名管理权限';
}
if (els.dRefresh) els.dRefresh.onclick = () => loadDomains();
if (els.dAdd) els.dAdd.onclick = () => createDomain();
if (els.dInput) {
  els.dInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter'){
      e.preventDefault();
      createDomain();
    }
  });
}
loadDomains();

// ===== 二级页面：编辑用户 =====
window.openEdit = (id, name, role, limit, canSend) => {
  els.editModal.classList.add('show');
  if (els.editName) els.editName.value = name;
  if (els.editUserDisplay){ els.editUserDisplay.textContent = name; }
  els.editRoleCheck.checked = (String(role) === 'admin');
  els.editLimit.value = Number(limit||0);
  els.editSendCheck.checked = !!canSend;
  els.editNewName.value = '';
  els.editPass.value = '';
  els.editSave.onclick = async () => {
    try{
      setButtonLoading(els.editSave, '保存中…');
      const body = { mailboxLimit: Number(els.editLimit.value||0), can_send: els.editSendCheck.checked ? 1 : 0, role: els.editRoleCheck.checked ? 'admin' : 'user' };
      const newName = (els.editNewName.value||'').trim();
      const newPass = (els.editPass.value||'').trim();
      if (newName) body.username = newName;
      if (newPass) body.password = newPass;
      const r = await api(`/api/users/${id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
      if (!r.ok){ const t = await r.text(); throw new Error(t); }
      showToast('已保存','success');
      els.editModal.classList.remove('show');
      loadUsers();
    }catch(e){ showToast('保存失败：' + (e?.message||e), 'warn'); }
    finally { restoreButton(els.editSave); }
  };
  if (els.editClearMailboxes) {
    els.editClearMailboxes.onclick = () => openAdminConfirm(
      `确定清空用户 ${name} 名下的所有邮箱及相关数据吗？`,
      async () => { await clearUserMailboxData(id, name); }
    );
  }
  els.editDelete.onclick = () => openAdminConfirm('确定删除该用户及其关联邮箱绑定（不会删除邮箱实体与邮件）？', async () => { await deleteUser(id); });
};
els.editClose.onclick = () => els.editModal.classList.remove('show');
els.editCancel.onclick = () => els.editModal.classList.remove('show');

// 点击遮罩关闭所有模态（不保存）
document.addEventListener('mousedown', (e) => {
  const opened = document.querySelectorAll('.modal.show');
  opened.forEach(m => {
    const card = m.querySelector('.modal-card');
    if (card && !card.contains(e.target)){
      m.classList.remove('show');
    }
  });
});

// 会话检查：访客进入演示管理页时展示提示条
(async () => {
  try{
    const r = await fetch('/api/session');
    if (!r.ok) return;
    const s = await r.json();
    __canManageDomains = !!(s?.strictAdmin || s?.role === 'guest');
    if (els.dInput) els.dInput.disabled = !__canManageDomains;
    if (els.dAdd) {
      els.dAdd.disabled = !__canManageDomains;
      els.dAdd.title = __canManageDomains ? '' : '仅严格管理员可添加域名';
    }
    if (s && s.role === 'guest' && els.demoBanner){ els.demoBanner.style.display = 'block'; }
    renderDomains(__domainsCache);
  }catch(_){ }
})();


