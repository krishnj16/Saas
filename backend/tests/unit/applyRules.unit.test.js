const { applyRules } = require('../../services/vulnProcessor');

describe('applyRules unit tests', () => {
  test('VirusTotal malicious -> force critical and tag vt_malicious', () => {
    const finding = {
      normalized_severity: 'medium',
      vt_malicious: true,
      exploitability_score: 0,
      rule_tags: []
    };
    const result = applyRules(finding, {});
    expect(result.normalized_severity).toBe('critical');
    expect(result.rule_tags).toContain('vt_malicious');
  });

  test('many hosts non-exploitable -> force medium and tag', () => {
    const finding = {
      normalized_severity: 'high',
      vt_malicious: false,
      exploitability_score: 0,
      rule_tags: []
    };
    const context = { occurrencesAcrossHosts: 6, exploitabilityAggregate: 0, threshold: 5 };
    const result = applyRules(finding, context);
    expect(result.normalized_severity).toBe('medium');
    expect(result.rule_tags).toContain('many_hosts_non_exploitable');
  });

  test('exploitability_score >=7 bumps severity', () => {
    const finding = {
      normalized_severity: 'low',
      vt_malicious: false,
      exploitability_score: 7,
      rule_tags: []
    };
    const result = applyRules(finding, {});
    expect(result.normalized_severity).toBe('medium');
    expect(result.rule_tags).toContain('exploitability_high');
  });

  test('combination: vt_malicious overrides bump rules', () => {
    const finding = {
      normalized_severity: 'low',
      vt_malicious: true,
      exploitability_score: 9,
      rule_tags: []
    };
    const result = applyRules(finding, { occurrencesAcrossHosts: 10, exploitabilityAggregate: 0 });
    expect(result.normalized_severity).toBe('critical'); 
    expect(result.rule_tags).toEqual(expect.arrayContaining(['vt_malicious', 'exploitability_high']));
  });
});
