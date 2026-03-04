const PrivacyPage = () => {
  return (
    <div className='bg-[#fafafa] py-10' dir='rtl'>
      <div className='container mx-auto max-w-4xl rounded-2xl bg-white px-6 py-8 shadow-sm'>
        <h1 className='text-3xl font-bold text-[#111111]'>سياسة الخصوصية</h1>
        <div className='mt-3 h-1.5 w-24 rounded-full bg-payzone-gold' />

        <div className='mt-6 space-y-4 text-base leading-8 text-[#4b5563]'>
          <p>نحن في متجر الصاحب نحترم خصوصية عملائنا ونلتزم بحماية المعلومات الشخصية التي يتم مشاركتها معنا.</p>
          <p>قد نقوم بجمع بعض المعلومات مثل الاسم ورقم الهاتف وعنوان الشحن فقط لغرض معالجة الطلبات وتقديم الخدمة بشكل أفضل.</p>
          <p>لا نقوم ببيع أو مشاركة بيانات العملاء مع أي طرف ثالث.</p>
          <p>يتم استخدام المعلومات فقط لإتمام الطلبات وتحسين تجربة المستخدم داخل الموقع.</p>
          <p>باستخدامك لهذا الموقع فإنك توافق على سياسة الخصوصية الخاصة بنا.</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
