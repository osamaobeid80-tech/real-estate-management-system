/* ============================================
   نظام إدارة العقارات - طبقة الوصول للبيانات (RESTful Table API)
   ============================================ */

const API = {
  async list(table, { page=1, limit=100, search='', sort='' } = {}){
    const params = new URLSearchParams({ page, limit });
    if(search) params.set('search', search);
    if(sort) params.set('sort', sort);
    const res = await fetch(`tables/${table}?${params.toString()}`);
    if(!res.ok) throw new Error('فشل تحميل البيانات');
    return res.json();
  },
  async get(table, id){
    const res = await fetch(`tables/${table}/${id}`);
    if(!res.ok) throw new Error('السجل غير موجود');
    return res.json();
  },
  async create(table, data){
    const res = await fetch(`tables/${table}`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(data)
    });
    if(!res.ok) throw new Error('فشل إنشاء السجل');
    return res.json();
  },
  async update(table, id, data){
    const res = await fetch(`tables/${table}/${id}`, {
      method:'PATCH',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(data)
    });
    if(!res.ok) throw new Error('فشل تحديث السجل');
    return res.json();
  },
  async remove(table, id){
    const res = await fetch(`tables/${table}/${id}`, { method:'DELETE' });
    if(!res.ok && res.status !== 204) throw new Error('فشل حذف السجل');
    return true;
  },
  // يجلب كل السجلات عبر الصفحات (للجداول الصغيرة نسبيًا كحالة مكتب عقاري)
  async listAll(table){
    let page = 1; const limit = 100; let all = [];
    while(true){
      const res = await this.list(table, { page, limit });
      all = all.concat(res.data || []);
      if(!res.data || res.data.length < limit) break;
      page++;
      if(page > 50) break; // حد أمان
    }
    return all;
  }
};
