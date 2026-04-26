/**
 * achievements.js — Achievement Definitions
 * Each achievement has a unique id, display info, and unlock condition description.
 */

export const LEVEL_THRESHOLDS = [
  { level: 1,  xp: 0,    title: 'Novice' },
  { level: 2,  xp: 100,  title: 'Beginner' },
  { level: 3,  xp: 250,  title: 'Student' },
  { level: 4,  xp: 500,  title: 'Explorer' },
  { level: 5,  xp: 800,  title: 'Practitioner' },
  { level: 6,  xp: 1200, title: 'Specialist' },
  { level: 7,  xp: 1800, title: 'Expert' },
  { level: 8,  xp: 2500, title: 'Master' },
  { level: 9,  xp: 3500, title: 'Architect' },
  { level: 10, xp: 5000, title: 'CCNA Ready' },
];

export const ACHIEVEMENTS = [
  { id: 'first-steps',      icon: 'PASS', title: 'First Steps',        desc: 'Complete your first module' },
  { id: 'lab-rat',          icon: 'LAB', title: 'Lab Rat',            desc: 'Complete 5 simulations' },
  { id: 'subnet-ninja',     icon: 'SUBNET', title: 'Subnet Ninja',       desc: 'Score 100% on a subnetting quiz' },
  { id: 'on-fire',          icon: 'HOT', title: 'On Fire',            desc: 'Maintain a 7-day streak' },
  { id: 'protocol-expert',  icon: 'ARP', title: 'Protocol Expert',    desc: 'Complete all protocol header modules' },
  { id: 'speed-demon',      icon: 'FAST', title: 'Speed Demon',        desc: 'Complete a simulation in under 2 minutes' },
  { id: 'fundamentals-done',icon: 'GREEN', title: 'Fundamentals Master',desc: 'Complete the Fundamentals path' },
  { id: 'switching-done',   icon: 'YELLOW', title: 'Switching Pro',      desc: 'Complete the Switching path' },
  { id: 'routing-done',     icon: 'ORANGE', title: 'Routing Guru',       desc: 'Complete the Routing path' },
  { id: 'ccna-ready',       icon: 'STUDY', title: 'CCNA Ready',         desc: 'Complete all learning paths' },
  { id: 'perfect-quiz',     icon: '100', title: 'Perfect Score',      desc: 'Score 100% on any quiz' },
  { id: '3-day-streak',     icon: 'HOT', title: '3-Day Streak',       desc: 'Study 3 days in a row' },
  { id: 'exam-passed',      icon: 'EXAM', title: 'Exam Passed',        desc: 'Score 80%+ on a mock exam' },
];
