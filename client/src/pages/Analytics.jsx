import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useUrls } from '../hooks/useUrls';
import { useAuth } from '../hooks/useAuth';

const COLORS = ['#00ff88', '#00cc66', '#009944', '#006622'];

const Analytics = () => {
  const { shortCode } = useParams();
  const { getAnalytics } = useUrls();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const load = async () => {
      const res = await getAnalytics(shortCode);
      if (res.success) setData(res.data);
      else setError(res.message);
      setLoading(false);
    };

    load();
  }, [shortCode, user, navigate, getAnalytics]);

  if (loading) {
    return (
      <div
        style={{
          background: '#0a0a0a',
          minHeight: 'calc(100vh - 60px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#555',
          fontFamily: "'Courier New', monospace",
        }}
      >
        Loading analytics...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          background: '#0a0a0a',
          minHeight: 'calc(100vh - 60px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ff4444',
          fontFamily: "'Courier New', monospace",
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 60px)',
        background: '#0a0a0a',
        padding: '2rem',
        fontFamily: "'Courier New', monospace",
      }}
    >
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            background: 'none',
            border: 'none',
            color: '#555',
            cursor: 'pointer',
            fontSize: '0.9rem',
            marginBottom: '1.5rem',
            fontFamily: "'Courier New', monospace",
            padding: 0,
          }}
        >
          {'<-'} Back to dashboard
        </button>

        <h1 style={{ color: '#fff', margin: '0 0 0.5rem', fontSize: '1.8rem' }}>Analytics</h1>
        <p style={{ color: '#444', margin: '0 0 2rem', fontSize: '0.85rem' }}>
          <span style={{ color: '#00ff88' }}>{data?.shortUrl}</span> {'->'} {data?.originalUrl}
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          {[
            { label: 'Total clicks', value: data?.totalClicks || 0 },
            { label: 'Devices', value: data?.byDevice?.length || 0 },
            { label: 'Browsers', value: data?.byBrowser?.length || 0 },
            { label: 'Sources', value: data?.byReferrer?.length || 0 },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: '#0f0f0f',
                border: '1px solid #1a1a1a',
                borderRadius: '12px',
                padding: '1.25rem',
                textAlign: 'center',
              }}
            >
              <div style={{ color: '#00ff88', fontSize: '2rem', fontWeight: 700 }}>{stat.value}</div>
              <div style={{ color: '#555', fontSize: '0.8rem', marginTop: '4px' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {data?.last7Days?.length > 0 && (
          <div
            style={{
              background: '#0f0f0f',
              border: '1px solid #1a1a1a',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '1rem',
            }}
          >
            <h3 style={{ color: '#fff', margin: '0 0 1.5rem', fontSize: '1rem' }}>Clicks - last 7 days</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.last7Days}>
                <XAxis dataKey="date" stroke="#333" tick={{ fill: '#555', fontSize: 11 }} />
                <YAxis stroke="#333" tick={{ fill: '#555', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
                />
                <Bar dataKey="count" fill="#00ff88" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {[
            { title: 'By device', data: data?.byDevice },
            { title: 'By browser', data: data?.byBrowser },
          ].map(({ title, data: chartData }) => (
            <div
              key={title}
              style={{
                background: '#0f0f0f',
                border: '1px solid #1a1a1a',
                borderRadius: '12px',
                padding: '1.5rem',
              }}
            >
              <h3 style={{ color: '#fff', margin: '0 0 1rem', fontSize: '1rem' }}>{title}</h3>
              {chartData?.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={chartData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={60}>
                        {chartData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: '#111',
                          border: '1px solid #333',
                          borderRadius: '8px',
                          color: '#fff',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '0.5rem' }}>
                    {chartData.map((item, i) => (
                      <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <span style={{ color: COLORS[i % COLORS.length] }}>o {item.name}</span>
                        <span style={{ color: '#555' }}>{item.count}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p style={{ color: '#333', fontSize: '0.85rem' }}>No data yet</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
