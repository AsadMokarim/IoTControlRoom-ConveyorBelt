import React from 'react';

const stages = [
  {
    title: 'Healthy splice',
    desc: 'Normal operating condition with no detected degradation.'
  },
  {
    title: 'Minor artificial defect',
    desc: 'Early defect signature detected during monitoring.'
  },
  {
    title: 'Partial splice weakening',
    desc: 'Structural performance is beginning to deteriorate.'
  },
  {
    title: 'Severe degradation',
    desc: 'Critical condition requiring immediate inspection.'
  }
];

const DegradationTimeline = ({ activeStage = 0 }) => {
  return (
    <div className="degradation-timeline">
        {stages.map((stage, index) => (
            <React.Fragment key={index}>
                <div className={`degradation-stage ${index === activeStage ? 'active' : ''}`}>
                    <div className="stage-marker">
                        <span>{index}</span>
                    </div>

                    <div className="stage-content">
                        <span className="stage-label">Stage {index}</span>
                        <strong>{stage.title}</strong>
                        <p>{stage.desc}</p>
                    </div>
                </div>

                {index < stages.length - 1 && <div className="timeline-connector"></div>}
            </React.Fragment>
        ))}
    </div>
  );
};

export default DegradationTimeline;
