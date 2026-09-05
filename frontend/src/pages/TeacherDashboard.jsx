import { useRef, useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { Users, Star, BarChart2, Award, BookOpen, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function TeacherDashboard() {
  const { feedbacks, teachers } = useData();
  const { user } = useAuth();
  const [selectedSubject, setSelectedSubject] = useState('All');

  // Find the current logged-in teacher record to parse subjects
  const currentTeacherRecord = useMemo(() => {
    return teachers.find(t => t.id === user.id || t.email === user.email || t.name === user.name);
  }, [teachers, user.id, user.email, user.name]);

  const teacherSubjects = useMemo(() => {
    if (!currentTeacherRecord || !currentTeacherRecord.subject) return [];
    if (Array.isArray(currentTeacherRecord.subject)) return currentTeacherRecord.subject;
    return currentTeacherRecord.subject.split(',').map(s => s.trim()).filter(Boolean);
  }, [currentTeacherRecord]);

  // Filter feedbacks only for the logged in teacher
  const myFeedbacks = useMemo(() => {
    return feedbacks.filter(f => f.teacher_name === user.name);
  }, [feedbacks, user.name]);

  // Further filter feedbacks by the selected subject
  const filteredMyFeedbacks = useMemo(() => {
    if (selectedSubject === 'All') return myFeedbacks;
    return myFeedbacks.filter(f => (f.subject || 'General') === selectedSubject);
  }, [myFeedbacks, selectedSubject]);

  const stats = useMemo(() => {
    if (filteredMyFeedbacks.length === 0) return { avg: 0, count: 0 };
    let totalScore = 0;
    let numRatings = 0;
    filteredMyFeedbacks.forEach(f => {
      Object.values(f.ratings).forEach(rating => {
        totalScore += parseInt(rating);
        numRatings++;
      });
    });
    return {
      avg: numRatings > 0 ? (totalScore / numRatings).toFixed(2) : 0,
      count: filteredMyFeedbacks.length
    };
  }, [filteredMyFeedbacks]);

  const grade = useMemo(() => {
    if (stats.avg >= 4.5) return 'A+';
    if (stats.avg >= 4.0) return 'A';
    if (stats.avg >= 3.0) return 'B';
    if (stats.avg >= 2.0) return 'C';
    return 'D';
  }, [stats.avg]);

  const certificateRef = useRef(null);
  const [isGeneratingCert, setIsGeneratingCert] = useState(false);

  const downloadCertificate = async () => {
    if (!certificateRef.current) return;
    setIsGeneratingCert(true);
    try {
      const canvas = await html2canvas(certificateRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);
      pdf.save(`${user.name.replace(/\s+/g, '_')}_Performance_Certificate.pdf`);
    } catch (err) {
      console.error("Error generating certificate", err);
    }
    setIsGeneratingCert(false);
  };

  // --- Analytics Data Processing ---
  const barChartData = useMemo(() => {
    if (filteredMyFeedbacks.length === 0) return [];
    const sums = { q1: 0, q2: 0, q3: 0, q4: 0, q5: 0, q6: 0, q7: 0, q8: 0, q9: 0, q10: 0 };
    
    filteredMyFeedbacks.forEach(f => {
      Object.keys(sums).forEach(q => {
        if (f.ratings && f.ratings[q]) {
          sums[q] += parseInt(f.ratings[q], 10);
        }
      });
    });

    const labels = {
      q1: 'Knowledge', q2: 'Clarity', q3: 'Pace', q4: 'Participation', q5: 'Management',
      q6: 'Aids', q7: 'Fairness', q8: 'Feedback', q9: 'Approachability', q10: 'Punctuality'
    };

    return Object.keys(sums).map(key => ({
      name: labels[key],
      rating: parseFloat((sums[key] / filteredMyFeedbacks.length).toFixed(1))
    }));
  }, [filteredMyFeedbacks]);

  const pieChartData = useMemo(() => {
    if (filteredMyFeedbacks.length === 0) return [];
    const enthusiasmCounts = {};
    filteredMyFeedbacks.forEach(f => {
      if (f.mcq && f.mcq.enthusiasm) {
        enthusiasmCounts[f.mcq.enthusiasm] = (enthusiasmCounts[f.mcq.enthusiasm] || 0) + 1;
      }
    });
    return Object.keys(enthusiasmCounts).map(key => ({
      name: key,
      value: enthusiasmCounts[key]
    }));
  }, [filteredMyFeedbacks]);

  return (
    <>
      <Navbar />
      <div className="container page-wrapper">
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Welcome, {user.name}</h1>
            {teacherSubjects.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>Your Subjects:</span>
                {teacherSubjects.map(sub => (
                  <span key={sub} className="badge badge-primary" style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>{sub}</span>
                ))}
              </div>
            )}
            <p style={{ color: 'var(--text-muted)' }}>Here is your anonymized feedback summary.</p>
          </div>
          
          {myFeedbacks.length > 0 && (
            <button 
              onClick={downloadCertificate} 
              disabled={isGeneratingCert}
              className="btn btn-primary" 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
            >
              <Award size={18} />
              {isGeneratingCert ? 'Generating...' : 'Download Official Certificate'}
            </button>
          )}
        </div>

        <div className="animate-fade-in">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(79, 70, 229, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                <Users size={30} />
              </div>
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>Total Responses</p>
                <h2 style={{ fontSize: '2rem', margin: 0 }}>{stats.count}</h2>
              </div>
            </div>
            
            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)' }}>
                <Star size={30} />
              </div>
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>Average Rating</p>
                <h2 style={{ fontSize: '2rem', margin: 0 }}>{stats.avg} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ 5</span></h2>
              </div>
            </div>
          </div>

          {/* ANALYTICS SECTION */}
          {myFeedbacks.length > 0 ? (
            <>
              {/* Subject Filter Dropdown */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-full)' }}>
                  <Filter size={18} color="var(--primary)" />
                  <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>Filter by Subject:</span>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    style={{ border: 'none', background: 'transparent', outline: 'none', fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer' }}
                  >
                    <option value="All">All Subjects</option>
                    {teacherSubjects.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                    {myFeedbacks.some(f => !f.subject || f.subject === 'General') && !teacherSubjects.includes('General') && (
                      <option value="General">General / N/A</option>
                    )}
                  </select>
                </div>
              </div>

              {filteredMyFeedbacks.length > 0 ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                      <h3 style={{ fontSize: '1.125rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <BarChart2 size={20} color="var(--primary)" /> Average Rating per Metric
                      </h3>
                      <div style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer>
                          <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} angle={-45} textAnchor="end" />
                            <YAxis domain={[0, 5]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                            <RechartsTooltip cursor={{ fill: 'rgba(79, 70, 229, 0.05)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                            <Bar dataKey="rating" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={30} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                      <h3 style={{ fontSize: '1.125rem', marginBottom: '1.5rem' }}>Student Enthusiasm</h3>
                      <div style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer>
                          <PieChart>
                            <Pie
                              data={pieChartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={90}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {pieChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem' }}>
                        {pieChartData.map((entry, index) => (
                          <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: COLORS[index % COLORS.length] }}></div>
                            {entry.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="table-container glass-panel">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Subject</th>
                          <th>Avg Score</th>
                          <th>Key Feedback & Suggestions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMyFeedbacks.map(f => {
                          const total = Object.values(f.ratings).reduce((acc, curr) => acc + curr, 0);
                          const avg = (total / 10).toFixed(1);
                          const date = new Date(f.timestamp).toLocaleDateString();

                          return (
                            <tr key={f.id}>
                              <td style={{ whiteSpace: 'nowrap' }}>{date}</td>
                              <td><span className="badge badge-secondary">{f.subject || 'General'}</span></td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600, color: avg >= 4 ? 'var(--success)' : avg >= 3 ? 'var(--warning)' : 'var(--error)' }}>
                                  <Star size={16} fill="currentColor" /> {avg}
                                </div>
                              </td>
                              <td style={{ width: '100%' }}>
                                <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                  <strong>Strengths: </strong> {f.text_responses.strengths || "N/A"}
                                </div>
                                <div style={{ color: 'var(--text-muted)' }}>
                                  <strong>Improvements: </strong> {f.text_responses.improvements || "N/A"}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No feedback has been submitted for the subject "{selectedSubject}" yet.
                </div>
              )}
            </>
          ) : (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No feedback has been submitted for you yet.
            </div>
          )}
        </div>
        
        {/* OFF-SCREEN CERTIFICATE TEMPLATE */}
        {myFeedbacks.length > 0 && (
          <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
            <div ref={certificateRef} style={{ width: '1122px', height: '793px', backgroundColor: '#ffffff', padding: '40px', boxSizing: 'border-box', position: 'relative', fontFamily: 'serif', color: '#1e293b' }}>
              <div style={{ border: '15px solid #0f172a', outline: '4px solid #d4af37', outlineOffset: '-24px', width: '100%', height: '100%', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative' }}>
                <h1 style={{ fontSize: '48px', color: '#0f172a', margin: '20px 0', textTransform: 'uppercase', letterSpacing: '4px' }}>Certificate of Excellence</h1>
                <div style={{ fontSize: '24px', fontStyle: 'italic', color: '#64748b', marginBottom: '40px' }}>This is to certify that</div>
                <h2 style={{ fontSize: '56px', color: '#4f46e5', margin: '0 0 40px 0', fontFamily: 'sans-serif' }}>{user.name}</h2>
                <div style={{ fontSize: '24px', color: '#334155', maxWidth: '800px', lineHeight: '1.6' }}>
                  has achieved an overall pedagogical performance rating of <strong>{stats.avg} / 5.0</strong> based on {stats.count} student evaluations. 
                  <br/><br/>
                  For exceptional dedication to education and student success, they are hereby awarded the performance grade of:
                </div>
                <div style={{ fontSize: '80px', color: '#d4af37', fontWeight: 'bold', margin: '20px 0', textShadow: '2px 2px 4px rgba(0,0,0,0.1)' }}>
                  {grade}
                </div>
                
                <div style={{ position: 'absolute', bottom: '60px', left: '80px', textAlign: 'center' }}>
                  <div style={{ width: '250px', borderBottom: '2px solid #0f172a', marginBottom: '10px' }}></div>
                  <div style={{ fontSize: '18px', color: '#64748b' }}>Date of Issue: {new Date().toLocaleDateString()}</div>
                </div>
                
                <div style={{ position: 'absolute', bottom: '60px', right: '80px', textAlign: 'center' }}>
                  <div style={{ width: '250px', borderBottom: '2px solid #0f172a', marginBottom: '10px' }}></div>
                  <div style={{ fontSize: '18px', color: '#64748b' }}>Institutional Administrator</div>
                </div>
                
                <div style={{ position: 'absolute', bottom: '60px', left: '50%', transform: 'translateX(-50%)' }}>
                  <div style={{ width: '120px', height: '120px', backgroundColor: '#d4af37', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '24px', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
                    SEAL
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
