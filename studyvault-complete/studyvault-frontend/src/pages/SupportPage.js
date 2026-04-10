import React from 'react';
import Sidebar from '../components/Sidebar/Sidebar';
import './SupportPage.css';

const supportEmail = 'support.dhinesh@gmail.com';

const topics = [
  {
    title: 'Forgot Credentials',
    desc: 'Get help recovering or resetting your account access quickly.',
    icon: '🔐',
  },
  {
    title: 'Feedback & Suggestions',
    desc: 'Share ideas, improvements, and UX feedback to shape future updates.',
    icon: '💡',
  },
  {
    title: 'Feature Requests',
    desc: 'Request workflows or capabilities you want in your day-to-day use.',
    icon: '🚀',
  },
  {
    title: 'Bug Reports',
    desc: 'Report issues with a short description and screenshot for faster fixes.',
    icon: '🛠️',
  },
];

export default function SupportPage() {
  const subject = encodeURIComponent('StudyVault Support Request');
  const body = encodeURIComponent('Hi,\n\nI need help with:\n\nDetails:\n\nThanks.');
  const mailto = `mailto:${supportEmail}?subject=${subject}&body=${body}`;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content fade-in support-page">
        <div className="support-hero card">
          <div className="support-eyebrow">Support Center</div>
          <h1 className="support-title">How can we help you today?</h1>
          <p className="support-sub">
            For account help, suggestions, feature modifications, and issue reports, contact
            {' '}
            <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
          </p>
          <a className="btn btn-primary support-cta" href={mailto}>Email Support</a>
        </div>

        <div className="support-grid">
          {topics.map((topic) => (
            <article className="support-card card" key={topic.title}>
              <div className="support-icon" aria-hidden="true">{topic.icon}</div>
              <h2>{topic.title}</h2>
              <p>{topic.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
