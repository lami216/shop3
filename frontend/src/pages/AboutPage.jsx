const AboutPage = () => {
  return (
    <div className='bg-[#fafafa] py-10' dir='rtl'>
      <div className='container mx-auto max-w-4xl rounded-2xl bg-white px-6 py-8 shadow-sm'>
        <h1 className='text-3xl font-bold text-[#111111]'>من نحن</h1>
        <div className='mt-3 h-1.5 w-24 rounded-full bg-payzone-gold' />

        <div className='mt-6 space-y-4 text-base leading-8 text-[#4b5563]'>
          <p>
            الصاحب هو متجر متخصص في تقديم العطور المختارة بعناية من أشهر دور العطور العالمية والشرقية. نحرص على توفير منتجات أصلية وتجربة
            شراء سهلة وسريعة لعملائنا.
          </p>
          <p>
            نهدف إلى جعل تجربة اختيار العطر تجربة مميزة من خلال توفير مجموعة متنوعة من الروائح التي تناسب مختلف الأذواق.
          </p>
          <p>نسعى دائماً إلى تقديم منتجات عالية الجودة وخدمة موثوقة عبر متجرنا الإلكتروني.</p>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
