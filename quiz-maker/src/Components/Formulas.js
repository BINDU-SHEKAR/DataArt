import React, { useEffect, useState } from 'react';

function Formulas() {
  const [groupedFormulas, setGroupedFormulas] = useState({});

  useEffect(() => {
    fetch('http://localhost:5000/api/formulas')
      .then(res => res.json())
      .then(data => {
        // Group formulas by subject
        const grouped = data.reduce((acc, formula) => {
          const subject = formula.subject;
          if (!acc[subject]) acc[subject] = [];
          acc[subject].push(formula);
          return acc;
        }, {});
        setGroupedFormulas(grouped);
      })
      .catch(err => console.error('Error fetching formulas:', err));
  }, []);

  return (
    <div style={{ padding: '1rem' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>📘 Formulas by Subject</h2>
      {Object.keys(groupedFormulas).length === 0 ? (
        <p>No formulas found.</p>
      ) : (
        Object.keys(groupedFormulas).map(subject => (
          <div
            key={subject}
            style={{
              marginBottom: '2rem',
              border: '2px solid #007bff',
              borderRadius: '8px',
              padding: '1rem',
              backgroundColor: '#f0f8ff',
            }}
          >
            <h3 style={{ color: '#007bff', marginBottom: '1rem' }}>{subject}</h3>
            {groupedFormulas[subject].map(f => (
              <div
                key={f.id}
                style={{
                  marginBottom: '1rem',
                  backgroundColor: '#ffffff',
                  padding: '1rem',
                  borderRadius: '6px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
              >
                <h4 style={{ marginBottom: '0.5rem' }}>{f.topic}</h4>
                <p><strong>Formula:</strong> {f.formula}</p>
                <p><em>{f.description}</em></p>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}

export default Formulas;
