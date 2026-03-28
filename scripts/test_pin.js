require('dotenv').config({ path: '.env.vercel.check' });

const req = { pin: '4747' };

const coordPin = process.env.COORDINATOR_PIN?.replace(/["']/g, '')?.replace(/\\r\\n/g, '')?.trim();
const uretimPin = process.env.URETIM_PIN?.replace(/["']/g, '')?.replace(/\\r\\n/g, '')?.trim();
const genelPin = process.env.GENEL_PIN?.replace(/["']/g, '')?.replace(/\\r\\n/g, '')?.trim();

const PINLER = {
    [coordPin || '4747']: 'tam',
    [uretimPin || '1244']: 'uretim',
    [genelPin || '8888']: 'genel',
};

console.log('Resulting PINLER object:', PINLER);
console.log('Is 4747 working?', PINLER['4747'] || null);
console.log('Raw ENV variables:');
console.log('COORDINATOR_PIN:', `"${process.env.COORDINATOR_PIN}"`, typeof process.env.COORDINATOR_PIN);
console.log('URETIM_PIN:', `"${process.env.URETIM_PIN}"`, typeof process.env.URETIM_PIN);
console.log('NEXT_PUBLIC_ADMIN_PIN:', `"${process.env.NEXT_PUBLIC_ADMIN_PIN}"`);
