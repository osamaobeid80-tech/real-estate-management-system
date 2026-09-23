// Middleware المصادقة والتفويض (RBAC) الحقيقي - يُنفَّذ على الخادم لا في المتصفح
const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'يجب تسجيل الدخول للوصول لهذا المورد' });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, full_name, role }
    next();
  } catch (e) {
    return res.status(401).json({ error: 'جلسة غير صالحة أو منتهية، يرجى تسجيل الدخول مجددًا' });
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'صلاحيات غير كافية لتنفيذ هذا الإجراء' });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
