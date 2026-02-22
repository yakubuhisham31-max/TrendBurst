import TrendCard from '../TrendCard';

export default function TrendCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      <TrendCard
        id="1"
        trendName="Best AI Tools of 2025"
        username="techguru"
        category="AI"
        views={1243}
        participants={89}
        chatCount={156}
        createdAt={new Date(Date.now() - 1000 * 60 * 60 * 3)}
        onClick={() => console.log('Trend clicked')}
      />
      <TrendCard
        id="2"
        trendName="Epic Gaming Moments"
        username="gamerpro"
        category="Entertainment"
        views={2891}
        participants={234}
        chatCount={445}
        createdAt={new Date(Date.now() - 1000 * 60 * 60 * 12)}
        onClick={() => console.log('Trend clicked')}
      />
      <TrendCard
        id="3"
        trendName="Digital Art Showcase"
        username="artlover"
        category="Art"
        views={987}
        participants={45}
        chatCount={78}
        createdAt={new Date(Date.now() - 1000 * 60 * 60 * 24)}
        onClick={() => console.log('Trend clicked')}
      />
    </div>
  );
}
