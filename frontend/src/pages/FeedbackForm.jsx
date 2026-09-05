import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import Navbar from '../components/Navbar';
import { CheckCircle, AlertCircle, ArrowLeft, Mail } from 'lucide-react';
import emailjs from 'emailjs-com';

const LINEAR_QUESTIONS = [
  { id: 'q1', label: 'Subject Knowledge' },
  { id: 'q2', label: 'Instructional Clarity' },
  { id: 'q3', label: 'Pace of Learning' },
  { id: 'q4', label: 'Student Participation' },
  { id: 'q5', label: 'Classroom Management' },
  { id: 'q6', label: 'Use of Teaching Aids' },
  { id: 'q7', label: 'Fairness in Grading' },
  { id: 'q8', label: 'Feedback Quality' },
  { id: 'q9', label: 'Approachability' },
  { id: 'q10', label: 'Punctuality' }
];

const getTeacherSubjects = (teacher) => {
  if (!teacher || !teacher.subject) return [];
  if (Array.isArray(teacher.subject)) return teacher.subject;
  return teacher.subject.split(',').map(s => s.trim()).filter(Boolean);
};

export default function FeedbackForm() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { teacherId } = useParams();
  const { addFeedback } = useData();
  
  const teacher = location.state?.teacher || { id: teacherId, name: 'Selected Teacher' };
  const preselectedSubject = location.state?.subject || '';
  const teacherSubjects = getTeacherSubjects(teacher);

  const [ratings, setRatings] = useState({});
  const [selectedSubject, setSelectedSubject] = useState(preselectedSubject || '');
  const [mcq, setMcq] = useState({
    enthusiasm: '',
    practicalConnection: '',
    helpfulAspect: ''
  });
  const [textAnswers, setTextAnswers] = useState({
    strengths: '',
    improvements: '',
    general: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleRatingChange = (qId, value) => setRatings(prev => ({ ...prev, [qId]: value }));
  const handleMcqChange = (field, value) => setMcq(prev => ({ ...prev, [field]: value }));
  const handleTextChange = (field, value) => setTextAnswers(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!selectedSubject) {
      setError('Please select a subject to evaluate.');
      window.scrollTo(0, 0);
      return;
    }
    if (Object.keys(ratings).length < LINEAR_QUESTIONS.length) {
      setError('Please provide a rating for all linear scale questions.');
      window.scrollTo(0, 0);
      return;
    }
    if (!mcq.enthusiasm || !mcq.practicalConnection || !mcq.helpfulAspect) {
      setError('Please answer all multiple choice questions.');
      window.scrollTo(0, 0);
      return;
    }

    setSubmitting(true);
    setError('');

    const payload = {
      student_name: user.name,
      student_email: user.email,
      teacher_id: teacher.id,
      teacher_name: teacher.name,
      subject: selectedSubject,
      ratings,
      mcq,
      text_responses: textAnswers,
      timestamp: new Date().toISOString()
    };

    try {
      // 1. Save data locally
      await addFeedback(payload);
      
      // 2. Send Email Confirmation via EmailJS
      try {
        const templateParams = {
          to_name: user.name,
          to_email: user.email,
          teacher_name: teacher.name,
          date: new Date().toLocaleDateString()
        };
        // Simulated API call. If user wants real emails, they replace these placeholders in .env
        await emailjs.send(
          import.meta.env.VITE_EMAILJS_SERVICE_ID || 'dummy_service',
          import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'dummy_template',
          templateParams,
          import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'dummy_key'
        );
      } catch (emailErr) {
        // We catch this so the app doesn't break during the local demo if keys aren't set
        console.log("EmailJS is simulating submission for local demo.");
      }

      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 4000);
    } catch (err) {
      setError('An error occurred while submitting. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <>
        <Navbar />
        <div className="container page-wrapper" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div className="glass-panel animate-fade-in" style={{ padding: '3rem', textAlign: 'center', maxWidth: '500px' }}>
            <CheckCircle size={64} color="var(--success)" style={{ margin: '0 auto 1.5rem auto' }} />
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Feedback Submitted!</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Thank you for your valuable feedback for {teacher.name}.</p>
            
            <div style={{ backgroundColor: 'rgba(79, 70, 229, 0.1)', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', color: 'var(--primary)', marginBottom: '2rem' }}>
              <Mail size={20} />
              <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>A confirmation email has been sent to <strong>{user.email}</strong>.</span>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>You will be redirected to the dashboard shortly...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container page-wrapper">
        <button onClick={() => navigate('/dashboard')} className="btn btn-secondary" style={{ width: 'fit-content', padding: '0.5rem 1rem', marginBottom: '1.5rem' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        <div className="glass-panel animate-fade-in" style={{ padding: '2.5rem', maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ borderBottom: '1px solid var(--surface-border)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Evaluation Form</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.125rem' }}>Evaluating: <strong style={{ color: 'var(--primary)' }}>{teacher.name}</strong></p>
          </div>

          {error && (
            <div style={{ backgroundColor: '#fee2e2', color: 'var(--error)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Subject Selection Dropdown */}
            <div className="input-group" style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
              <label className="input-label" style={{ fontSize: '1.125rem', color: 'var(--text-main)', marginBottom: '0.5rem', fontWeight: 600 }}>
                Select Subject <span style={{ color: 'var(--error)' }}>*</span>
              </label>
              <select 
                className="input-field" 
                value={selectedSubject} 
                onChange={e => setSelectedSubject(e.target.value)}
                required
                disabled={!!preselectedSubject && teacherSubjects.includes(preselectedSubject)}
                style={{ width: '100%' }}
              >
                <option value="" disabled>-- Select Subject --</option>
                {teacherSubjects.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
              {preselectedSubject && teacherSubjects.includes(preselectedSubject) && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'block' }}>
                  Evaluating for pre-selected subject: <strong>{preselectedSubject}</strong>.
                </span>
              )}
            </div>
            {/* SECTION 1: Linear Scale */}
            <div style={{ marginBottom: '3rem' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--text-main)', borderBottom: '2px solid var(--primary)', display: 'inline-block', paddingBottom: '0.25rem' }}>Part 1: Core Metrics</h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Rate from 1 (Strongly Disagree) to 5 (Strongly Agree)</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {LINEAR_QUESTIONS.map((q) => (
                  <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)' }}>
                    <span style={{ fontWeight: 500, flex: 1 }}>{q.label}</span>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      {[1, 2, 3, 4, 5].map(val => (
                        <label key={val} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', gap: '0.25rem' }}>
                          <input 
                            type="radio" 
                            name={q.id} 
                            value={val} 
                            checked={ratings[q.id] === val}
                            onChange={() => handleRatingChange(q.id, val)}
                            style={{ width: '1.25rem', height: '1.25rem', accentColor: 'var(--primary)', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{val}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 2: Multiple Choice */}
            <div style={{ marginBottom: '3rem' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--text-main)', borderBottom: '2px solid var(--primary)', display: 'inline-block', paddingBottom: '0.25rem' }}>Part 2: Teaching Style</h2>
              
              <div className="input-group" style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                <label className="input-label" style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '1rem' }}>Teacher's enthusiasm during classes:</label>
                <select className="input-field" value={mcq.enthusiasm} onChange={e => handleMcqChange('enthusiasm', e.target.value)}>
                  <option value="" disabled>Select an option</option>
                  <option value="Very High">Very High</option>
                  <option value="High">High</option>
                  <option value="Average">Average</option>
                  <option value="Low">Low</option>
                  <option value="Very Low">Very Low</option>
                </select>
              </div>

              <div className="input-group" style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                <label className="input-label" style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '1rem' }}>Theory to practical connection:</label>
                <select className="input-field" value={mcq.practicalConnection} onChange={e => handleMcqChange('practicalConnection', e.target.value)}>
                  <option value="" disabled>Select an option</option>
                  <option value="Always">Always</option>
                  <option value="Frequently">Frequently</option>
                  <option value="Sometimes">Sometimes</option>
                  <option value="Rarely">Rarely</option>
                  <option value="Never">Never</option>
                </select>
              </div>

              <div className="input-group" style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                <label className="input-label" style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '1rem' }}>Most helpful teaching aspect:</label>
                <select className="input-field" value={mcq.helpfulAspect} onChange={e => handleMcqChange('helpfulAspect', e.target.value)}>
                  <option value="" disabled>Select an option</option>
                  <option value="Clear explanations">Clear explanations</option>
                  <option value="Interaction">Interaction</option>
                  <option value="Study materials">Study materials</option>
                  <option value="Feedback">Feedback</option>
                  <option value="Practical demos">Practical demos</option>
                </select>
              </div>
            </div>

            {/* SECTION 3: Open-Ended */}
            <div style={{ marginBottom: '3rem' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--text-main)', borderBottom: '2px solid var(--primary)', display: 'inline-block', paddingBottom: '0.25rem' }}>Part 3: Detailed Comments</h2>

              <div className="input-group">
                <label className="input-label">Strengths</label>
                <textarea 
                  className="input-field" 
                  rows="3" 
                  placeholder="What are the teacher's main strengths?"
                  value={textAnswers.strengths}
                  onChange={e => handleTextChange('strengths', e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Areas for Improvement</label>
                <textarea 
                  className="input-field" 
                  rows="3" 
                  placeholder="What could the teacher improve upon?"
                  value={textAnswers.improvements}
                  onChange={e => handleTextChange('improvements', e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label">General Comments</label>
                <textarea 
                  className="input-field" 
                  rows="3" 
                  placeholder="Any other feedback?"
                  value={textAnswers.general}
                  onChange={e => handleTextChange('general', e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.125rem' }} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
