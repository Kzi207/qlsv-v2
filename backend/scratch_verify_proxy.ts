import prisma from './src/utils/prisma';

async function check() {
  console.log('Testing prisma.class property...');
  if (prisma.class) {
    console.log('SUCCESS: prisma.class is accessible and points to:', prisma.class.constructor.name);
  } else {
    console.log('FAILURE: prisma.class is still undefined');
  }
  process.exit(0);
}

check();
