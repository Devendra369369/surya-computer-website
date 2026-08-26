/* SURYA ADMIN GUARD v1.0.0 — client-side gate only; backend remains authoritative. */
(function(){
  const token=sessionStorage.getItem('SURYA_ADMIN_TOKEN');
  const auth=sessionStorage.getItem('SURYA_ADMIN_AUTH');
  if(!token || auth!=='true'){
    const target=encodeURIComponent(location.pathname.split('/').pop()||'admin.html');
    location.replace('admin-login.html?next='+target);
  }
})();
