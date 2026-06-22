/* ============================================================
   网球工具箱 · 共享个人档案层 profile.js
   单一 localStorage 对象 tennis_profile_v1，所有页面 <script src> 引入。
   同源跨页天然共享；问题清单由 AI 诊断/测评回写，各工具读它做个性化。
   ============================================================ */
(function (global) {
  const PKEY = 'tennis_profile_v1';
  const LOG = { diag: 'tennis_diag_log_v1', checkin: 'tn_log', assess: 'tennis_assess_log_v1' };

  function deepMerge(t, s) {
    for (const k in s) {
      if (s[k] && typeof s[k] === 'object' && !Array.isArray(s[k])) { t[k] = t[k] || {}; deepMerge(t[k], s[k]); }
      else t[k] = s[k];
    } return t;
  }

  const KEY_FIELDS = ['body.height', 'body.weight', 'body.strength', 'background.ntrpSelf',
    'background.handedness', 'background.backhand', 'gear.racket', 'prefs.idols', 'goals.primary'];
  function getPath(o, p) { return p.split('.').reduce((a, k) => (a == null ? a : a[k]), o); }

  const Profile = {
    _default() {
      return {
        _v: 1, _onboarded: false, _completeness: 0,
        body: {},          // height,weight,gender,ageBand,strength,swingSpeed,injuries[]
        background: {},    // playYears,ntrpSelf,ntrpTested,weeklyFreq,scenes[],handedness,backhand
        gear: {},          // racket,weight,headSize,stringType,tension
        issues: [],        // {id,area,desc,severity,status,source,ts}
        prefs: {},         // idols[],playStyle[],fhGrip,starLike,starLearn
        goals: {}          // primary,targetNtrp,weeklyCheckinGoal
      };
    },
    get() { try { return JSON.parse(localStorage.getItem(PKEY)) || this._default(); } catch (e) { return this._default(); } },
    save(p) {
      p._v = 1;
      let filled = 0; KEY_FIELDS.forEach(f => { const v = getPath(p, f); if (v != null && v !== '' && !(Array.isArray(v) && !v.length)) filled++; });
      p._completeness = Math.round(filled / KEY_FIELDS.length * 100) / 100;
      localStorage.setItem(PKEY, JSON.stringify(p));
      return p;
    },
    patch(partial) { const p = this.get(); deepMerge(p, partial); return this.save(p); },
    setOnboarded() { const p = this.get(); p._onboarded = true; return this.save(p); },

    addIssue(issue) { // {area,desc,severity,source}
      const p = this.get();
      // 去重：同 area+desc 不重复加
      if (!p.issues.some(i => i.area === issue.area && i.desc === issue.desc && i.status !== 'resolved')) {
        p.issues.push(Object.assign({ id: 'iss_' + (p.issues.length + 1) + '_' + (p.issues.length), status: 'todo', ts: '' }, issue));
        this.save(p);
      } return p;
    },
    resolveIssue(id) { const p = this.get(); const it = p.issues.find(i => i.id === id); if (it) it.status = 'resolved'; return this.save(p); },
    openIssues() { return this.get().issues.filter(i => i.status !== 'resolved'); },

    // 工具历史（与 profile 解耦）
    pushLog(kind, entry) { const k = LOG[kind]; if (!k) return; let a = []; try { a = JSON.parse(localStorage.getItem(k) || '[]'); } catch (e) { } a.unshift(entry); localStorage.setItem(k, JSON.stringify(a)); },
    getLog(kind) { const k = LOG[kind]; try { return JSON.parse(localStorage.getItem(k) || '[]'); } catch (e) { return []; } },

    // 导出/导入（换设备逃生通道）
    exportAll() { const o = {}; [PKEY, LOG.diag, LOG.checkin, LOG.assess].forEach(k => { const v = localStorage.getItem(k); if (v) o[k] = v; }); return JSON.stringify(o); },
    importAll(json) { try { const o = JSON.parse(json); for (const k in o) localStorage.setItem(k, o[k]); return true; } catch (e) { return false; } },

    // NTRP 白话辅助（onboarding 用）
    NTRP_DESC: {
      '1.5': '刚起步，主要还在把球打过网',
      '2.0': '上过几节课，能慢慢打几拍，但明显弱点多',
      '2.5': '能和同水平的人把球打来回几拍',
      '3.0': '中速球比较稳，但一追求方向/深度就不稳',
      '3.5': '中速球能稳定控方向，深度和变化还不足',
      '4.0': '正反手都能控方向和深度，会用高球/上网',
      '4.5': '有力量旋转、能接快球、按局面变战术'
    }
  };

  global.Profile = Profile;
})(window);
