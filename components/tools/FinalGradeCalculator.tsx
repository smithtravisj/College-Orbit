'use client';

import { useState, useMemo } from 'react';
import Input, { Select } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Calculator, Target, TrendingUp, AlertCircle } from 'lucide-react';

interface FinalGradeCalculatorProps {
  theme?: string; // Reserved for future theme-specific styling
}

const gradeThresholds: { grade: string; min: number }[] = [
  { grade: 'A', min: 93 },
  { grade: 'A-', min: 90 },
  { grade: 'B+', min: 87 },
  { grade: 'B', min: 83 },
  { grade: 'B-', min: 80 },
  { grade: 'C+', min: 77 },
  { grade: 'C', min: 73 },
  { grade: 'C-', min: 70 },
  { grade: 'D+', min: 67 },
  { grade: 'D', min: 63 },
  { grade: 'F', min: 0 },
];

const targetGradeOptions = [
  { value: 'A', label: 'A (93%)' },
  { value: 'A-', label: 'A- (90%)' },
  { value: 'B+', label: 'B+ (87%)' },
  { value: 'B', label: 'B (83%)' },
  { value: 'B-', label: 'B- (80%)' },
  { value: 'C+', label: 'C+ (77%)' },
  { value: 'C', label: 'C (73%)' },
  { value: 'C-', label: 'C- (70%)' },
  { value: 'D+', label: 'D+ (67%)' },
  { value: 'D', label: 'D (63%)' },
];

function getMinPercentageForGrade(grade: string): number {
  const threshold = gradeThresholds.find((t) => t.grade === grade);
  return threshold ? threshold.min : 0;
}

function getGradeFromPercentage(percentage: number): string {
  for (const threshold of gradeThresholds) {
    if (percentage >= threshold.min) {
      return threshold.grade;
    }
  }
  return 'F';
}

export default function FinalGradeCalculator({ theme: _theme }: FinalGradeCalculatorProps) {
  const [currentGrade, setCurrentGrade] = useState('');
  const [finalWeight, setFinalWeight] = useState('');
  const [targetGrade, setTargetGrade] = useState('B');
  const [hasCalculated, setHasCalculated] = useState(false);

  const result = useMemo(() => {
    const current = parseFloat(currentGrade);
    const weight = parseFloat(finalWeight);

    if (isNaN(current) || isNaN(weight) || weight <= 0 || weight > 100) {
      return null;
    }

    const targetPercentage = getMinPercentageForGrade(targetGrade);
    const weightDecimal = weight / 100;

    // Formula: current * (1 - weight) + final * weight = target
    // Solving for final: final = (target - current * (1 - weight)) / weight
    const neededScore = (targetPercentage - current * (1 - weightDecimal)) / weightDecimal;

    // Calculate what grade you'd get with different final scores
    const gradeWith100 = current * (1 - weightDecimal) + 100 * weightDecimal;
    const gradeWith0 = current * (1 - weightDecimal);

    return {
      neededScore: Math.round(neededScore * 10) / 10,
      targetPercentage,
      isPossible: neededScore <= 100,
      isGuaranteed: neededScore <= 0,
      maxPossibleGrade: getGradeFromPercentage(gradeWith100),
      minPossibleGrade: getGradeFromPercentage(gradeWith0),
      currentGradeWithoutFinal: Math.round(gradeWith0 * 10) / 10,
    };
  }, [currentGrade, finalWeight, targetGrade]);

  const handleCalculate = () => {
    setHasCalculated(true);
  };

  const handleReset = () => {
    setCurrentGrade('');
    setFinalWeight('');
    setTargetGrade('B');
    setHasCalculated(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Input Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--text-muted)',
              marginBottom: '6px',
            }}
          >
            Current Grade (before final)
          </label>
          <div style={{ position: 'relative' }}>
            <Input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={currentGrade}
              onChange={(e) => {
                setCurrentGrade(e.target.value);
                setHasCalculated(false);
              }}
              placeholder="e.g., 85"
              style={{ paddingRight: '36px' }}
            />
            <span
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                fontSize: '14px',
                pointerEvents: 'none',
              }}
            >
              %
            </span>
          </div>
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--text-muted)',
              marginBottom: '6px',
            }}
          >
            Final Exam Weight
          </label>
          <div style={{ position: 'relative' }}>
            <Input
              type="number"
              step="1"
              min="1"
              max="100"
              value={finalWeight}
              onChange={(e) => {
                setFinalWeight(e.target.value);
                setHasCalculated(false);
              }}
              placeholder="e.g., 30"
              style={{ paddingRight: '36px' }}
            />
            <span
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                fontSize: '14px',
                pointerEvents: 'none',
              }}
            >
              %
            </span>
          </div>
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--text-muted)',
              marginBottom: '6px',
            }}
          >
            Target Grade
          </label>
          <Select
            value={targetGrade}
            onChange={(e) => {
              setTargetGrade(e.target.value);
              setHasCalculated(false);
            }}
            options={targetGradeOptions}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button onClick={handleCalculate} style={{ flex: 1 }}>
            <Calculator size={18} />
            Calculate
          </Button>
          {hasCalculated && (
            <Button variant="secondary" onClick={handleReset}>
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Results Section */}
      {hasCalculated && result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Main Result Card */}
          <div
            style={{
              padding: '20px',
              backgroundColor: result.isPossible
                ? result.isGuaranteed
                  ? 'var(--success-bg, rgba(34, 197, 94, 0.1))'
                  : 'var(--accent-bg)'
                : 'var(--danger-bg, rgba(239, 68, 68, 0.1))',
              border: `1px solid ${
                result.isPossible
                  ? result.isGuaranteed
                    ? 'var(--success, #22c55e)'
                    : 'var(--accent)'
                  : 'var(--danger, #ef4444)'
              }`,
              borderRadius: '12px',
              textAlign: 'center',
            }}
          >
            {result.isGuaranteed ? (
              <>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginBottom: '8px',
                  }}
                >
                  <TrendingUp size={20} style={{ color: 'var(--success, #22c55e)' }} />
                  <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--success, #22c55e)' }}>
                    You're already there!
                  </span>
                </div>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                  You'll get a {targetGrade} even if you score 0% on the final.
                </p>
              </>
            ) : result.isPossible ? (
              <>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  To get a {targetGrade}, you need at least
                </div>
                <div
                  style={{
                    fontSize: '42px',
                    fontWeight: 'bold',
                    color: 'var(--link)',
                    marginBottom: '4px',
                  }}
                >
                  {result.neededScore}%
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>on your final exam</div>
              </>
            ) : (
              <>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginBottom: '8px',
                  }}
                >
                  <AlertCircle size={20} style={{ color: 'var(--danger, #ef4444)' }} />
                  <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--danger, #ef4444)' }}>
                    Not possible
                  </span>
                </div>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                  Even with a perfect 100% on the final, you'd need {result.neededScore}% which isn't achievable.
                </p>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
                  Your best possible grade is a <strong>{result.maxPossibleGrade}</strong>
                </p>
              </>
            )}
          </div>

          {/* Additional Info */}
          {result.isPossible && !result.isGuaranteed && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
              }}
            >
              <div
                style={{
                  padding: '14px',
                  backgroundColor: 'var(--panel-2)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  If you score 100%
                </div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)' }}>
                  {result.maxPossibleGrade}
                </div>
              </div>
              <div
                style={{
                  padding: '14px',
                  backgroundColor: 'var(--panel-2)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Without the final
                </div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)' }}>
                  {result.currentGradeWithoutFinal}%
                </div>
              </div>
            </div>
          )}

          {/* Grade Breakdown Table */}
          {result.isPossible && (
            <div
              style={{
                padding: '16px',
                backgroundColor: 'var(--panel-2)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
              }}
            >
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'var(--text-muted)',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Target size={14} />
                Score needed for each grade
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {targetGradeOptions.slice(0, 6).map((option) => {
                  const minForGrade = getMinPercentageForGrade(option.value);
                  const weightDecimal = parseFloat(finalWeight) / 100;
                  const current = parseFloat(currentGrade);
                  const needed = (minForGrade - current * (1 - weightDecimal)) / weightDecimal;
                  const roundedNeeded = Math.round(needed * 10) / 10;
                  const isPossible = roundedNeeded <= 100;
                  const isGuaranteed = roundedNeeded <= 0;

                  return (
                    <div
                      key={option.value}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        backgroundColor:
                          option.value === targetGrade ? 'var(--accent-bg)' : 'transparent',
                        borderRadius: '6px',
                        border:
                          option.value === targetGrade ? '1px solid var(--accent)' : '1px solid transparent',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: option.value === targetGrade ? 600 : 400,
                          color: option.value === targetGrade ? 'var(--link)' : 'var(--text)',
                        }}
                      >
                        {option.value}
                      </span>
                      <span
                        style={{
                          fontSize: '14px',
                          color: !isPossible
                            ? 'var(--danger, #ef4444)'
                            : isGuaranteed
                            ? 'var(--success, #22c55e)'
                            : 'var(--text-muted)',
                          fontWeight: option.value === targetGrade ? 600 : 400,
                        }}
                      >
                        {isGuaranteed ? 'Guaranteed' : isPossible ? `${roundedNeeded}%` : 'Not possible'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State / Instructions */}
      {!hasCalculated && (
        <div
          style={{
            padding: '20px',
            backgroundColor: 'var(--panel-2)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            textAlign: 'center',
          }}
        >
          <Calculator
            size={32}
            style={{ color: 'var(--text-muted)', marginBottom: '12px', opacity: 0.5 }}
          />
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
            Enter your current grade and final exam weight to see what score you need.
          </p>
        </div>
      )}
    </div>
  );
}
