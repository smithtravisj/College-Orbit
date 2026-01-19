import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// All hardcoded colleges with their data
const colleges = [
  {
    fullName: 'Arizona State University',
    acronym: 'ASU',
    darkAccent: '#8C1D40',
    darkLink: '#ff8fa3',
    lightAccent: '#ff90b3',
    lightLink: '#8C1D40',
    quickLinks: [
      { label: 'Home', url: 'https://www.asu.edu/' },
      { label: 'My ASU', url: 'https://my.asu.edu/' },
      { label: 'ASU Email', url: 'https://email.asu.edu' },
      { label: 'Academic Calendar', url: 'https://registrar.asu.edu/academic-calendar' },
      { label: 'Records & Transcript', url: 'https://registrar.asu.edu/' },
      { label: 'ASU Library', url: 'https://lib.asu.edu/' },
      { label: 'Housing', url: 'https://asu.starrezhousing.com/StarRezPortalX/Login' },
      { label: 'Registrar', url: 'https://registrar.asu.edu/' },
    ],
  },
  {
    fullName: 'Brigham Young University',
    acronym: 'BYU',
    darkAccent: '#002E5D',
    darkLink: '#6ab2ff',
    lightAccent: '#6ab2ff',
    lightLink: '#0035a8',
    quickLinks: [
      { label: 'Home', url: 'https://www.byu.edu/' },
      { label: 'MyBYU', url: 'https://my.byu.edu/' },
      { label: 'Learning Suite', url: 'https://learningsuite.byu.edu/.2d5C/student/top' },
      { label: 'Canvas', url: 'https://byu.instructure.com/' },
      { label: 'BYU Outlook', url: 'https://outlook.office.com/mail/' },
      { label: '2026 Calendar', url: 'https://academiccalendar.byu.edu/?y=2026' },
      { label: 'Record Summary', url: 'https://y.byu.edu/ry/ae/prod/records/cgi/stdCourseWork.cgi' },
      { label: 'MyMap W2026', url: 'https://commtech.byu.edu/auth/mymap/?yearTerm=20261&proxyId=509241872#/' },
      { label: 'Financial Center', url: 'https://sa.byu.edu/psc/ps/EMPLOYEE/SA/c/Y_MY_FINANCIAL_CENTER.Y_MFC_HOME_V2_FL.GBL?Page=Y_MFC_HOME_V2_FL&EMPLID=247348708&OPRID=ins0417&' },
      { label: 'BYU Library', url: 'https://lib.byu.edu/' },
      { label: 'Residence Life', url: 'https://reslife.byu.edu/' },
      { label: 'Endorsement', url: 'https://endorse.byu.edu/' },
      { label: 'Textbooks', url: 'https://booklist.byu.edu/' },
    ],
  },
  {
    fullName: 'Brigham Young University Hawaii',
    acronym: 'BYUH',
    darkAccent: '#9e1b34',
    darkLink: '#f5a6b4',
    lightAccent: '#f5a6b4',
    lightLink: '#9e1b34',
    quickLinks: [
      { label: 'Home', url: 'https://www.byuh.edu/' },
      { label: 'myBYUH', url: 'https://my.byuh.edu/' },
      { label: 'BYUH Outlook', url: 'https://outlook.office.com/mail/' },
      { label: 'Calendar', url: 'https://registrar.byuh.edu/academic-calendar' },
      { label: 'Records Summary', url: 'https://my.byuh.edu/student-records' },
      { label: 'Degree Audit', url: 'https://my.byuh.edu/degree-audit' },
      { label: 'Financial Center', url: 'https://my.byuh.edu/financial-services' },
      { label: 'BYUH Library', url: 'https://library.byuh.edu/' },
      { label: 'Student Housing', url: 'https://housing.byuh.edu/' },
      { label: 'Advising Center', url: 'https://advising.byuh.edu/' },
      { label: 'Career Services', url: 'https://career.byuh.edu/' },
      { label: 'Endorsements', url: 'https://endorse.byuh.edu/' },
    ],
  },
  {
    fullName: 'Brigham Young University Idaho',
    acronym: 'BYUI',
    darkAccent: '#0063A5',
    darkLink: '#7bbaff',
    lightAccent: '#7bbaff',
    lightLink: '#0063A5',
    quickLinks: [
      { label: 'Home', url: 'https://www.byui.edu/' },
      { label: 'myBYUI', url: 'https://my.byui.edu/' },
      { label: 'BYUI Outlook', url: 'https://outlook.office.com/mail/' },
      { label: 'Calendar', url: 'https://www.byui.edu/academic-calendar' },
      { label: 'Records Summary', url: 'https://my.byui.edu/student-records' },
      { label: 'Degree Planner', url: 'https://my.byui.edu/degree-planner' },
      { label: 'Financial Center', url: 'https://my.byui.edu/finances' },
      { label: 'BYUI Library', url: 'https://library.byui.edu/' },
      { label: 'BYUI Student Living', url: 'https://www.byui.edu/student-living' },
      { label: 'Advising', url: 'https://www.byui.edu/advising' },
      { label: 'Career Services', url: 'https://www.byui.edu/career-services' },
      { label: 'Endorsements', url: 'https://www.byui.edu/student-honor-office/endorsements' },
    ],
  },
  {
    fullName: 'North Lincoln High School',
    acronym: 'NLHS',
    darkAccent: '#0035a8',
    darkLink: '#6ab2ff',
    lightAccent: '#64a7f0',
    lightLink: '#0035a8',
    quickLinks: [
      { label: 'Home', url: 'https://www.lcsnc.org/o/nlhs' },
      { label: 'Canvas', url: 'https://lcs-arms.lincoln.k12.nc.us' },
      { label: 'Google Classroom', url: 'https://classroom.google.com' },
      { label: 'Gmail', url: 'https://mail.google.com' },
      { label: 'Google Drive', url: 'https://drive.google.com' },
      { label: 'Classlink', url: 'https://launchpad.classlink.com/lcsnc' },
      { label: 'LaunchPad', url: 'https://myapps.classlink.com/home' },
      { label: 'Library', url: 'https://www.lcsnc.org/o/nlhs/page/media-center' },
      { label: 'Calendar', url: 'https://www.lcsnc.org/o/nlhs/events' },
    ],
  },
  {
    fullName: 'Ohio State University',
    acronym: 'OSU',
    darkAccent: '#7a0b22',
    darkLink: '#ff6b7a',
    lightAccent: '#db7d88',
    lightLink: '#7a0b22',
    quickLinks: [
      { label: 'Home', url: 'https://www.osu.edu/' },
      { label: 'Buckeye Link', url: 'https://buckeyelink.osu.edu/' },
      { label: 'Outlook Email', url: 'https://outlook.office.com/mail/' },
      { label: 'Academic Calendar', url: 'https://registrar.osu.edu/academic-calendar/' },
      { label: 'Records & Transcript', url: 'https://registrar.osu.edu/student-hub/transcripts-and-verifications/' },
      { label: 'Financial Center', url: 'https://busfin.osu.edu/bursar/studentaccount' },
      { label: 'OSU Library', url: 'https://library.osu.edu/' },
      { label: 'Housing', url: 'https://osu.starrezhousing.com/StarRezPortalX' },
      { label: 'Registrar', url: 'https://registrar.osu.edu/' },
      { label: 'Advising', url: 'https://advising.osu.edu/' },
      { label: 'Career Services', url: 'https://careers.osu.edu/students/career-services-offices' },
    ],
  },
  {
    fullName: 'UNC Chapel Hill',
    acronym: 'UNC',
    darkAccent: '#007FAE',
    darkLink: '#82ccff',
    lightAccent: '#82ccff',
    lightLink: '#007FAE',
    quickLinks: [
      { label: 'Home', url: 'https://www.unc.edu/' },
      { label: 'MyCarolina', url: 'https://mycarolina.unc.edu/' },
      { label: 'UNC Outlook', url: 'https://outlook.office.com/' },
      { label: 'Calendar', url: 'https://registrar.unc.edu/academic-calendar/' },
      { label: 'Student Records', url: 'https://connectcarolina.unc.edu/' },
      { label: 'Registration', url: 'https://connectcarolina.unc.edu/' },
      { label: 'UNC Libraries', url: 'https://library.unc.edu/' },
      { label: 'Housing', url: 'https://housing.unc.edu/' },
      { label: 'Advising Center', url: 'https://advising.unc.edu/' },
      { label: 'Career Center', url: 'https://careers.unc.edu/' },
    ],
  },
  {
    fullName: 'University of Central Florida',
    acronym: 'UCF',
    darkAccent: '#6d5611',
    darkLink: '#ffc857',
    lightAccent: '#fedf8c',
    lightLink: '#b69317',
    quickLinks: [
      { label: 'Home', url: 'https://www.ucf.edu/' },
      { label: 'Student Portal', url: 'https://my.ucf.edu/' },
      { label: 'Outlook Email', url: 'https://outlook.office.com/mail/' },
      { label: 'Academic Calendar', url: 'https://calendar.ucf.edu/' },
      { label: 'Records & Transcript', url: 'https://registrar.ucf.edu/transcript-request/' },
      { label: 'Financial Center', url: 'https://my.ucf.edu/' },
      { label: 'UCF Library', url: 'https://library.ucf.edu/' },
      { label: 'Housing', url: 'https://ucf.starrezhousing.com/StarRezPortal/' },
      { label: 'Registrar', url: 'https://registrar.ucf.edu/' },
      { label: 'Advising', url: 'https://academicsuccess.ucf.edu/ssa/advising-offices/' },
      { label: 'Career Services', url: 'https://career.ucf.edu/' },
    ],
  },
  {
    fullName: 'University of Texas at Austin',
    acronym: 'UT Austin',
    darkAccent: '#bf5700',
    darkLink: '#ff9d42',
    lightAccent: '#fab368',
    lightLink: '#bf5700',
    quickLinks: [
      { label: 'Home', url: 'https://www.utexas.edu/' },
      { label: 'Student Portal', url: 'https://my.utexas.edu/_kgo_default/persona/index' },
      { label: 'Outlook Email', url: 'https://outlook.office.com/mail/' },
      { label: 'Academic Calendar', url: 'https://registrar.utexas.edu/calendars' },
      { label: 'Records & Transcript', url: 'https://onestop.utexas.edu/student-records/transcripts-other-records/' },
      { label: 'Financial Aid', url: 'https://onestop.utexas.edu/managing-costs/scholarships-financial-aid/' },
      { label: 'UT Library', url: 'https://www.lib.utexas.edu/' },
      { label: 'Housing & Dining', url: 'https://housing.utexas.edu/' },
      { label: 'Registrar', url: 'https://registrar.utexas.edu/' },
      { label: 'Advising', url: 'https://catalog.utexas.edu/general-information/student-services/advising-and-career-counseling/' },
      { label: 'Career Services', url: 'https://careersuccess.utexas.edu/' },
    ],
  },
  {
    fullName: 'Utah State University',
    acronym: 'USU',
    darkAccent: '#0F2439',
    darkLink: '#8ac8ff',
    lightAccent: '#8ac8ff',
    lightLink: '#0F2439',
    quickLinks: [
      { label: 'Home', url: 'https://www.usu.edu/' },
      { label: 'myUSU', url: 'https://my.usu.edu/' },
      { label: 'USU Outlook', url: 'https://outlook.office.com/' },
      { label: 'Calendar', url: 'https://www.usu.edu/registrar/calendars' },
      { label: 'Student Records', url: 'https://my.usu.edu/' },
      { label: 'Degree Audit', url: 'https://my.usu.edu/' },
      { label: 'Financial Center', url: 'https://my.usu.edu/' },
      { label: 'USU Library', url: 'https://library.usu.edu/' },
      { label: 'Housing Services', url: 'https://www.usu.edu/housing/' },
      { label: 'Registrar', url: 'https://www.usu.edu/registrar/' },
      { label: 'Advising Center', url: 'https://www.usu.edu/advising/' },
      { label: 'Career Center', url: 'https://www.usu.edu/career/' },
    ],
  },
  {
    fullName: 'Utah Valley University',
    acronym: 'UVU',
    darkAccent: '#275038',
    darkLink: '#7cc49a',
    lightAccent: '#7cc49a',
    lightLink: '#275038',
    quickLinks: [
      { label: 'Home', url: 'https://www.uvu.edu/' },
      { label: 'myUVU', url: 'https://my.uvu.edu/' },
      { label: 'UVU Outlook', url: 'https://outlook.office.com/' },
      { label: 'Calendar', url: 'https://www.uvu.edu/registrar/academic-calendars/' },
      { label: 'Student Records', url: 'https://my.uvu.edu/' },
      { label: 'Degree Audit', url: 'https://my.uvu.edu/' },
      { label: 'Financial Center', url: 'https://my.uvu.edu/' },
      { label: 'UVU Library', url: 'https://www.uvu.edu/library/' },
      { label: 'Housing', url: 'https://www.uvu.edu/housing/' },
      { label: 'Registrar', url: 'https://www.uvu.edu/registrar/' },
      { label: 'Advising Center', url: 'https://www.uvu.edu/advising/' },
      { label: 'Career Center', url: 'https://www.uvu.edu/career/' },
    ],
  },
];

async function main() {
  console.log('Seeding colleges...');

  for (const college of colleges) {
    const existing = await prisma.college.findUnique({
      where: { fullName: college.fullName },
    });

    if (existing) {
      console.log(`Updating: ${college.fullName}`);
      await prisma.college.update({
        where: { fullName: college.fullName },
        data: college,
      });
    } else {
      console.log(`Creating: ${college.fullName}`);
      await prisma.college.create({
        data: college,
      });
    }
  }

  console.log('Done! Seeded', colleges.length, 'colleges.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
