import { useState, useMemo, useRef } from 'react';
import { useData } from '../context/DataContext';
import Navbar from '../components/Navbar';
import { Filter, Users, Star, UserPlus, Trash2, BarChart2, Download, FileText, Pencil, Edit } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const getTeacherSubjects = (teacher) => {
  if (!teacher || !teacher.subject) return [];
  if (Array.isArray(teacher.subject)) return teacher.subject;
  return teacher.subject.split(',').map(s => s.trim()).filter(Boolean);
};

export default function AdminDashboard() {
  const { feedbacks, teachers, addTeacher, updateTeacher, deleteTeacher, students, addStudent, updateStudent, deleteStudent, logs } = useData();
  const [activeTab, setActiveTab] = useState('feedback');

  // Filtering state for Feedback
  const [selectedTeacher, setSelectedTeacher] = useState('All');

  // Form states
  const [newTeacher, setNewTeacher] = useState({ name: '', subject: '', department: '', email: '', password: '' });
  const [newStudent, setNewStudent] = useState({ name: '', regNo: '', email: '', password: '' });
  const [studentError, setStudentError] = useState('');
  const [teacherError, setTeacherError] = useState('');

  // Editing states
  const [editingTeacherId, setEditingTeacherId] = useState(null);
  const [editingStudentId, setEditingStudentId] = useState(null);

  // Smart Summary
  const [smartSummary, setSmartSummary] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // Chart Refs
  const barChartRef = useRef(null);
  const pieChartRef = useRef(null);

  // --- NLP Sentiment Analysis (Simulated AI) ---
  const getSentiment = (text) => {
    if (!text) return 'Neutral';
    const lower = text.toLowerCase();
    const positiveWords = ['good', 'great', 'excellent', 'awesome', 'helpful', 'clear', 'best', 'love', 'perfect', 'amazing'];
    const negativeWords = ['bad', 'poor', 'terrible', 'worst', 'unhelpful', 'confusing', 'unclear', 'boring', 'hate', 'hard'];

    let score = 0;
    positiveWords.forEach(w => { if (lower.includes(w)) score++; });
    negativeWords.forEach(w => { if (lower.includes(w)) score--; });

    if (score > 0) return 'Positive';
    if (score < 0) return 'Negative';
    return 'Neutral';
  };

  // --- Feedback Logic ---
  const teachersList = useMemo(() => {
    const ts = new Set(feedbacks.map(f => f.teacher_name));
    return ['All', ...Array.from(ts)];
  }, [feedbacks]);

  const filteredFeedbacks = useMemo(() => {
    if (selectedTeacher === 'All') return feedbacks;
    return feedbacks.filter(f => f.teacher_name === selectedTeacher);
  }, [feedbacks, selectedTeacher]);

  const stats = useMemo(() => {
    if (filteredFeedbacks.length === 0) return { avg: 0, count: 0 };
    let totalScore = 0;
    let numRatings = 0;
    filteredFeedbacks.forEach(f => {
      Object.values(f.ratings).forEach(rating => {
        totalScore += parseInt(rating);
        numRatings++;
      });
    });
    return {
      avg: numRatings > 0 ? (totalScore / numRatings).toFixed(2) : 0,
      count: filteredFeedbacks.length
    };
  }, [filteredFeedbacks]);

  const generateSmartSummary = () => {
    if (filteredFeedbacks.length === 0) return;
    setIsGeneratingSummary(true);
    setSmartSummary('');

    setTimeout(() => {
      let positiveCount = 0;
      let negativeCount = 0;
      let avgScore = parseFloat(stats.avg);

      filteredFeedbacks.forEach(f => {
        const sentiment = getSentiment(f.text_responses.general || f.text_responses.strengths);
        if (sentiment === 'Positive') positiveCount++;
        if (sentiment === 'Negative') negativeCount++;
      });

      let summary = `Based on an analysis of ${stats.count} evaluation(s), `;

      if (avgScore >= 4.0) {
        summary += `this educator demonstrates exceptional instructional quality, maintaining a very high average rating of ${stats.avg}/5. `;
      } else if (avgScore >= 3.0) {
        summary += `this educator demonstrates a competent instructional approach with a solid average rating of ${stats.avg}/5. `;
      } else {
        summary += `this educator has significant areas requiring improvement, as indicated by an average rating of ${stats.avg}/5. `;
      }

      if (positiveCount >= negativeCount * 2 && positiveCount > 0) {
        summary += `The Natural Language Processing engine detected overwhelmingly positive sentiment in the open-ended comments. Students frequently highlighted strong communication and domain expertise. `;
      } else if (negativeCount > positiveCount) {
        summary += `However, NLP sentiment analysis detected concerning trends in student commentary. Administrators are advised to review the specific areas of improvement highlighted by students. `;
      } else {
        summary += `Sentiment analysis of open-ended feedback reveals a balanced reception among students, indicating a mix of strong teaching attributes and moderate areas for potential growth. `;
      }

      summary += `Overall, the quantitative and qualitative data suggests an engaged classroom environment that aligns with institutional standards.`;

      let i = 0;
      const typeWriter = setInterval(() => {
        setSmartSummary(summary.substring(0, i));
        i++;
        if (i > summary.length) {
          clearInterval(typeWriter);
          setIsGeneratingSummary(false);
        }
      }, 15);
    }, 800); // initial loading delay
  };

  // --- Analytics Data Processing ---
  const barChartData = useMemo(() => {
    if (filteredFeedbacks.length === 0) return [];
    const sums = { q1: 0, q2: 0, q3: 0, q4: 0, q5: 0, q6: 0, q7: 0, q8: 0, q9: 0, q10: 0 };

    filteredFeedbacks.forEach(f => {
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
      rating: parseFloat((sums[key] / filteredFeedbacks.length).toFixed(1))
    }));
  }, [filteredFeedbacks]);

  const pieChartData = useMemo(() => {
    if (filteredFeedbacks.length === 0) return [];
    const enthusiasmCounts = {};
    filteredFeedbacks.forEach(f => {
      if (f.mcq && f.mcq.enthusiasm) {
        enthusiasmCounts[f.mcq.enthusiasm] = (enthusiasmCounts[f.mcq.enthusiasm] || 0) + 1;
      }
    });
    return Object.keys(enthusiasmCounts).map(key => ({
      name: key,
      value: enthusiasmCounts[key]
    }));
  }, [filteredFeedbacks]);

  // --- Export Logic ---
  const exportPDF = async () => {
    const doc = new jsPDF();
    doc.text(`EduFeedback Report ${selectedTeacher !== 'All' ? '- ' + selectedTeacher : ''}`, 14, 15);

    let currentY = 20;

    // Capture Bar Chart
    if (barChartRef.current) {
      try {
        const canvas = await html2canvas(barChartRef.current, { backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/png');
        doc.addImage(imgData, 'PNG', 14, currentY, 110, 60);
      } catch (err) {
        console.error('Error capturing bar chart', err);
      }
    }

    // Capture Pie Chart
    if (pieChartRef.current) {
      try {
        const canvas = await html2canvas(pieChartRef.current, { backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/png');
        doc.addImage(imgData, 'PNG', 130, 20, 60, 60);
      } catch (err) {
        console.error('Error capturing pie chart', err);
      }
    }

    currentY += 70; // Start table below the charts

    const tableColumn = ["Date", "Student", "Teacher", "Subject", "Avg Score", "AI Sentiment", "Comments"];
    const tableRows = [];

    filteredFeedbacks.forEach(f => {
      const total = Object.values(f.ratings).reduce((acc, curr) => acc + curr, 0);
      const avg = (total / 10).toFixed(1);
      const sentiment = getSentiment(f.text_responses.general || f.text_responses.strengths);
      const date = new Date(f.timestamp).toLocaleDateString();
      const comments = f.text_responses.general || f.text_responses.strengths || "N/A";
      const subject = f.subject || "General";

      tableRows.push([date, f.student_name, f.teacher_name, subject, avg, sentiment, comments.substring(0, 50)]);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: currentY,
    });

    doc.save(`feedback_report_${new Date().getTime()}.pdf`);
  };

  const exportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Student,Teacher,Subject,Avg Score,AI Sentiment,Comments\n";

    filteredFeedbacks.forEach(f => {
      const total = Object.values(f.ratings).reduce((acc, curr) => acc + curr, 0);
      const avg = (total / 10).toFixed(1);
      const sentiment = getSentiment(f.text_responses.general || f.text_responses.strengths);
      const date = new Date(f.timestamp).toLocaleDateString();
      const comments = (f.text_responses.general || f.text_responses.strengths || "N/A").replace(/,/g, " "); // prevent csv comma issues
      const subject = f.subject || "General";

      csvContent += `${date},${f.student_name},${f.teacher_name},${subject},${avg},${sentiment},${comments}\n`;
    });

    csvContent += "\n\n--- SUMMARY DATA ---\n\n";

    csvContent += "Metric Averages\nMetric,Average Rating\n";
    barChartData.forEach(item => {
      csvContent += `${item.name},${item.rating}\n`;
    });

    csvContent += "\nTeacher Enthusiasm Distribution\nEnthusiasm Level,Count\n";
    pieChartData.forEach(item => {
      csvContent += `${item.name},${item.value}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `feedback_report_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Handlers ---
  const handleEditTeacherClick = (teacher) => {
    setEditingTeacherId(teacher.id);
    setNewTeacher({ name: teacher.name, subject: teacher.subject, department: teacher.department, email: teacher.email || '', password: teacher.password || '' });
    setTeacherError('');
  };

  const handleAddTeacher = (e) => {
    e.preventDefault();
    setTeacherError('');
    if (!newTeacher.name || !newTeacher.subject || !newTeacher.department) return;

    if (editingTeacherId) {
      const res = updateTeacher(editingTeacherId, newTeacher);
      res.then(result => {
        if (result.success) {
          setEditingTeacherId(null);
          setNewTeacher({ name: '', subject: '', department: '', email: '', password: '' });
        } else {
          setTeacherError(result.error);
        }
      });
    } else {
      const res = addTeacher(newTeacher);
      res.then(result => {
        if (result.success) {
          setNewTeacher({ name: '', subject: '', department: '', email: '', password: '' });
        } else {
          setTeacherError(result.error);
        }
      });
    }
  };

  const handleBulkUploadTeachers = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const lines = text.split('\n');
      lines.forEach((line, index) => {
        if (index === 0) return; // skip header
        const parts = line.split(',');
        if (parts.length >= 5) {
          addTeacher({ name: parts[0].trim(), subject: parts[1].trim(), department: parts[2].trim(), email: parts[3].trim(), password: parts[4].trim() });
        }
      });
      alert('Teachers imported successfully!');
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const handleBulkUploadStudents = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const lines = text.split('\n');
      lines.forEach((line, index) => {
        if (index === 0) return; // skip header
        const parts = line.split(',');
        if (parts.length >= 4) {
          addStudent({ name: parts[0].trim(), regNo: parts[1].trim(), email: parts[2].trim(), password: parts[3].trim() });
        }
      });
      alert('Students imported successfully!');
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const handleEditStudentClick = (student) => {
    setEditingStudentId(student.id);
    setNewStudent({ name: student.name, regNo: student.regNo || '', email: student.email, password: student.password });
    setStudentError('');
  };

  const handleAddStudent = (e) => {
    e.preventDefault();
    setStudentError('');
    if (!newStudent.name || !newStudent.regNo || !newStudent.email || !newStudent.password) return;

    if (editingStudentId) {
      const res = updateStudent(editingStudentId, newStudent);
      res.then(result => {
        if (result.success) {
          setEditingStudentId(null);
          setNewStudent({ name: '', regNo: '', email: '', password: '' });
        } else {
          setStudentError(result.error);
        }
      });
    } else {
      const res = addStudent(newStudent);
      res.then(result => {
        if (result.success) {
          setNewStudent({ name: '', regNo: '', email: '', password: '' });
        } else {
          setStudentError(result.error);
        }
      });
    }
  };

  return (
    <>
      <Navbar />
      <div className="container page-wrapper">
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Admin Dashboard</h1>
            <p style={{ color: 'var(--text-muted)' }}>Manage system data and view evaluations.</p>
          </div>

          {/* Export Buttons */}
          {activeTab === 'feedback' && filteredFeedbacks.length > 0 && (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={exportCSV} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
                <FileText size={16} /> Export CSV
              </button>
              <button onClick={exportPDF} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
                <Download size={16} /> Export PDF
              </button>
            </div>
          )}
        </div>

        {/* Custom Tabs */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
          <button
            className={`btn ${activeTab === 'feedback' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 'var(--radius-full)', padding: '0.5rem 1.5rem' }}
            onClick={() => setActiveTab('feedback')}
          >
            Feedback Responses
          </button>
          <button
            className={`btn ${activeTab === 'teachers' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 'var(--radius-full)', padding: '0.5rem 1.5rem' }}
            onClick={() => setActiveTab('teachers')}
          >
            Manage Teachers
          </button>
          <button
            className={`btn ${activeTab === 'students' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 'var(--radius-full)', padding: '0.5rem 1.5rem' }}
            onClick={() => setActiveTab('students')}
          >
            Manage Students
          </button>
          <button
            className={`btn ${activeTab === 'logs' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 'var(--radius-full)', padding: '0.5rem 1.5rem' }}
            onClick={() => setActiveTab('logs')}
          >
            System Logs
          </button>
        </div>

        {/* TAB: FEEDBACK */}
        {activeTab === 'feedback' && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
              <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-full)' }}>
                <Filter size={18} color="var(--primary)" />
                <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>Filter by Teacher:</span>
                <select
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                  style={{ border: 'none', background: 'transparent', outline: 'none', fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer' }}
                >
                  {teachersList.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

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
            {filteredFeedbacks.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem', gridColumn: '1 / -1', background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                      <Star size={20} color="var(--primary)" /> Generative AI Smart Summary
                    </h3>
                    <button
                      onClick={generateSmartSummary}
                      disabled={isGeneratingSummary || filteredFeedbacks.length === 0}
                      className="btn btn-primary"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                    >
                      {isGeneratingSummary ? 'Generating...' : 'Generate AI Report'}
                    </button>
                  </div>

                  <div style={{ minHeight: '60px', padding: '1rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', color: 'var(--text-main)', lineHeight: '1.6' }}>
                    {smartSummary || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Click "Generate AI Report" to create an automated performance summary based on NLP sentiment analysis and quantitative ratings.</span>}
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.125rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BarChart2 size={20} color="var(--primary)" /> Average Rating per Metric
                  </h3>
                  <div ref={barChartRef} style={{ height: '300px', width: '100%', backgroundColor: 'white' }}>
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
                  <h3 style={{ fontSize: '1.125rem', marginBottom: '1.5rem' }}>Teacher Enthusiasm</h3>
                  <div ref={pieChartRef} style={{ height: '300px', width: '100%', backgroundColor: 'white' }}>
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
            )}

            <div className="table-container glass-panel">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Student</th>
                    <th>Teacher Evaluated</th>
                    <th>Subject</th>
                    <th>Avg Score</th>
                    <th>AI Sentiment</th>
                    <th>Key Feedback</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFeedbacks.map(f => {
                    const total = Object.values(f.ratings).reduce((acc, curr) => acc + curr, 0);
                    const avg = (total / 10).toFixed(1);
                    const date = new Date(f.timestamp).toLocaleDateString();
                    const sentiment = getSentiment(f.text_responses.general || f.text_responses.strengths);

                    let sentimentColor = 'var(--text-muted)';
                    if (sentiment === 'Positive') sentimentColor = 'var(--success)';
                    if (sentiment === 'Negative') sentimentColor = 'var(--error)';

                    return (
                      <tr key={f.id}>
                        <td>{date}</td>
                        <td><div style={{ fontWeight: 500 }}>{f.student_name}</div></td>
                        <td><div className="badge badge-primary">{f.teacher_name}</div></td>
                        <td><span className="badge badge-secondary">{f.subject || 'General'}</span></td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600, color: avg >= 4 ? 'var(--success)' : avg >= 3 ? 'var(--warning)' : 'var(--error)' }}>
                            <Star size={16} fill="currentColor" /> {avg}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: sentimentColor, fontSize: '0.875rem' }}>
                            {sentiment}
                          </span>
                        </td>
                        <td>
                          <div style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                            "{f.text_responses.general || f.text_responses.strengths}"
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredFeedbacks.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        No feedback found. Wait for students to submit evaluations.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: TEACHERS */}
        {activeTab === 'teachers' && (
          <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
            <div className="table-container glass-panel" style={{ height: 'fit-content' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Teacher Name</th>
                    <th>Subjects</th>
                    <th>Department</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map(t => (
                    <tr key={t.id}>
                      <td><div style={{ fontWeight: 500 }}>{t.name}</div></td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                          {getTeacherSubjects(t).map(sub => (
                            <span key={sub} className="badge badge-secondary" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>{sub}</span>
                          ))}
                        </div>
                      </td>
                      <td><span className="badge badge-primary">{t.department}</span></td>
                      <td style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button onClick={() => handleEditTeacherClick(t)} className="btn" style={{ padding: '0.5rem', color: 'var(--primary)', background: 'transparent' }} title="Edit">
                          <Pencil size={18} />
                        </button>
                        <button onClick={() => deleteTeacher(t.id)} className="btn" style={{ padding: '0.5rem', color: 'var(--error)', background: 'transparent' }} title="Delete">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {teachers.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No teachers added yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="glass-panel" style={{ padding: '2rem', height: 'fit-content' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {editingTeacherId ? <Edit size={20} color="var(--primary)" /> : <UserPlus size={20} color="var(--primary)" />}
                  {editingTeacherId ? 'Edit Teacher' : 'Add Teacher'}
                </h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {!editingTeacherId && (
                    <label className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', cursor: 'pointer' }}>
                      Import CSV
                      <input type="file" accept=".csv" style={{ display: 'none' }} onChange={handleBulkUploadTeachers} />
                    </label>
                  )}
                  {editingTeacherId && (
                    <button onClick={() => { setEditingTeacherId(null); setNewTeacher({ name: '', subject: '', department: '', email: '', password: '' }); setTeacherError(''); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.875rem', textDecoration: 'underline' }}>
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              {teacherError && (
                <div style={{ backgroundColor: '#fee2e2', color: 'var(--error)', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                  {teacherError}
                </div>
              )}
              <form onSubmit={handleAddTeacher}>
                <div className="input-group">
                  <label className="input-label">Full Name</label>
                  <input type="text" className="input-field" placeholder="e.g. Dr. Jane Smith" value={newTeacher.name} onChange={e => setNewTeacher({ ...newTeacher, name: e.target.value })} required />
                </div>
                <div className="input-group">
                  <label className="input-label">Subject(s)</label>
                  <input type="text" className="input-field" placeholder="e.g. Mathematics, Physics" value={newTeacher.subject} onChange={e => setNewTeacher({ ...newTeacher, subject: e.target.value })} required />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Separate multiple subjects with commas.
                  </span>
                </div>
                <div className="input-group">
                  <label className="input-label">Department</label>
                  <input type="text" className="input-field" placeholder="e.g. Science Dept" value={newTeacher.department} onChange={e => setNewTeacher({ ...newTeacher, department: e.target.value })} required />
                </div>
                <div className="input-group">
                  <label className="input-label">Email Address (for login)</label>
                  <input type="email" className="input-field" placeholder="teacher@system.com" value={newTeacher.email} onChange={e => setNewTeacher({ ...newTeacher, email: e.target.value })} />
                </div>
                <div className="input-group">
                  <label className="input-label">Password</label>
                  <input type="text" className="input-field" placeholder="teacher123" value={newTeacher.password} onChange={e => setNewTeacher({ ...newTeacher, password: e.target.value })} />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  {editingTeacherId ? 'Update Teacher' : 'Add Teacher'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB: STUDENTS */}
        {activeTab === 'students' && (
          <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
            <div className="table-container glass-panel" style={{ height: 'fit-content' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>PRN Number </th>
                    <th>Email Address</th>
                    <th>Password</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.id}>
                      <td><div style={{ fontWeight: 500 }}>{s.name}</div></td>
                      <td><span className="badge badge-primary">{s.regNo || 'N/A'}</span></td>
                      <td>{s.email}</td>
                      <td><span style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>{s.password}</span></td>
                      <td style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button onClick={() => handleEditStudentClick(s)} className="btn" style={{ padding: '0.5rem', color: 'var(--primary)', background: 'transparent' }} title="Edit">
                          <Pencil size={18} />
                        </button>
                        <button onClick={() => deleteStudent(s.email)} className="btn" style={{ padding: '0.5rem', color: 'var(--error)', background: 'transparent' }} title="Delete">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No students added yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="glass-panel" style={{ padding: '2rem', height: 'fit-content' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {editingStudentId ? <Edit size={20} color="var(--primary)" /> : <UserPlus size={20} color="var(--primary)" />}
                  {editingStudentId ? 'Edit Student' : 'Add Student'}
                </h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {!editingStudentId && (
                    <label className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', cursor: 'pointer' }}>
                      Import CSV
                      <input type="file" accept=".csv" style={{ display: 'none' }} onChange={handleBulkUploadStudents} />
                    </label>
                  )}
                  {editingStudentId && (
                    <button onClick={() => { setEditingStudentId(null); setNewStudent({ name: '', regNo: '', email: '', password: '' }); setStudentError(''); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.875rem', textDecoration: 'underline' }}>
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              {studentError && (
                <div style={{ backgroundColor: '#fee2e2', color: 'var(--error)', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                  {studentError}
                </div>
              )}
              <form onSubmit={handleAddStudent}>
                <div className="input-group">
                  <label className="input-label">Full Name</label>
                  <input type="text" className="input-field" placeholder="e.g. John Doe" value={newStudent.name} onChange={e => setNewStudent({ ...newStudent, name: e.target.value })} required />
                </div>
                <div className="input-group">
                  <label className="input-label">PRN Number</label>
                  <input type="text" className="input-field" placeholder="e.g. MCA2024001" value={newStudent.regNo} onChange={e => setNewStudent({ ...newStudent, regNo: e.target.value })} required />
                </div>
                <div className="input-group">
                  <label className="input-label">Email Address</label>
                  <input type="email" className="input-field" placeholder="john@student.edu" value={newStudent.email} onChange={e => setNewStudent({ ...newStudent, email: e.target.value })} required />
                </div>
                <div className="input-group">
                  <label className="input-label">Password</label>
                  <input type="text" className="input-field" placeholder="Set a temporary password" value={newStudent.password} onChange={e => setNewStudent({ ...newStudent, password: e.target.value })} required />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  {editingStudentId ? 'Update Student' : 'Add Student'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB: SYSTEM LOGS */}
        {activeTab === 'logs' && (
          <div className="animate-fade-in glass-panel" style={{ padding: '2rem', backgroundColor: '#0f172a', color: '#10b981', fontFamily: 'monospace', borderRadius: 'var(--radius-lg)', minHeight: '400px' }}>
            <h3 style={{ color: '#fff', borderBottom: '1px solid #334155', paddingBottom: '1rem', marginBottom: '1rem', fontSize: '1.25rem' }}>&gt;_ SYSTEM AUDIT TRAIL</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', height: '500px', overflowY: 'auto' }}>
              {!logs || logs.length === 0 ? (
                <div style={{ color: '#64748b' }}>No system logs available.</div>
              ) : (
                logs.map(log => {
                  const isError = log.message.toLowerCase().includes('fail') || log.message.toLowerCase().includes('error') || log.message.toLowerCase().includes('delete');
                  return (
                    <div key={log.id} style={{ display: 'flex', gap: '1rem', padding: '0.25rem 0', color: isError ? '#ef4444' : '#10b981' }}>
                      <span style={{ color: '#64748b', minWidth: '200px' }}>[{new Date(log.timestamp).toLocaleString()}]</span>
                      <span>{log.message}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
