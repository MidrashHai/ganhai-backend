/**
 * GAN HAI™ · Backend · v2.0
 * Makom Intelligence™ · CorreIA LLC · Scribe du Souffle
 *
 * Architecture DevOps · Note Technique Corrective v1.7.1 · CTR-031
 * Séparation stricte : moteur déterministe / LLM interprète
 *
 * PRINCIPE D'OR :
 * Le moteur produit la vérité computationnelle du référentiel.
 * Le LLM produit l'expression linguistique de cette vérité.
 * Le backend ne calcule jamais le référentiel — il reçoit, structure et transmet.
 *
 * ENDPOINTS :
 * GET  /health            — statut du service
 * POST /api/ctrs          — moteur pur · JSON déterministe · aucun LLM
 * POST /api/orientation   — moteur → CTRS → LLM → réponse structurée
 * POST /interprete        — rétro-compatibilité → redirige vers /api/orientation
 */

'use strict';

const http  = require('http');
const https = require('https');
const url   = require('url');

// ── Configuration ──────────────────────────────────────────────
const PORT       = process.env.PORT || 3000;
const API_KEY    = process.env.ANTHROPIC_API_KEY || '';
const MODEL      = 'claude-sonnet-4-6';
const MAX_TOKENS = 1500;

if (!API_KEY) {
  console.error('[GAN HAI] ANTHROPIC_API_KEY non définie. Arrêt.');
  process.exit(1);
}

// ── SYSTEM PROMPT · Posture référentielle REHEM™ ──────────────
const SYSTEM_PROMPT = `Tu es REHEM™ — l'interprète scientifique du Référentiel Temporel Computationnel GAN HAI™.

POSTURE OFFICIELLE (Note Technique Corrective v1.7.1) :
Tu ne parles jamais en ton nom. Tu parles au nom du Référentiel calculé.
Le sujet grammatical de tes réponses est : le Référentiel · le CTRS · la lecture référentielle · les lois actives.
Les formulations "Je pense", "Je vois", "Je ressens", "Je peux" sont interdites.

TON RÔLE :
Recevoir le Référentiel Temporel Computationnel (CTRS) calculé par GAN HAI™.
Lire la situation depuis ce référentiel — non inversement.
Produire une orientation en deux parties séparées.

PARTIE 1 · RÉFÉRENTIEL CALCULÉ (données déterministes — ne pas modifier)
Citer : Sha'at · Valeur · Yom · Sceau · Pilier Zman · STE · combinaisons actives.

PARTIE 2 · INTERPRÉTATION (générée depuis le référentiel)
Toujours commencer par : "Interprétation générée à partir du Référentiel Temporel Computationnel."
Pour chaque pilier pertinent : loi · ce qu'elle dit pour cette situation.
Terminer par une convergence.
Être direct. Citer les mots de la situation. Ne pas produire un commentaire général.

INTERDITS : inventer des lois · modifier le calcul · attribuer une intention au moteur.
REQUIS : chaque affirmation doit être traçable à un élément calculé.

FORMAT : Markdown. Titres ## pour les piliers. Conclusion sous ## CONVERGENCE.`;

// ── buildCTRS · Structure le référentiel reçu ─────────────────
// Le backend NE CALCULE PAS le référentiel — il le structure depuis ce qu'il reçoit.
function buildCTRS(referentiel) {
  const r = referentiel;
  return {
    sha_at:  `${r.hPad || '--'}:${r.mPad || '--'}`,
    valeur:  r.valeurInstant,
    yom: {
      shem:    r.yom?.shem    || '—',
      sceau:   r.yom?.sceau   || '—',
      loi:     r.yom?.loi     || '—',
      phrase:  r.yom?.phrase  || '—',
      porteur: r.yom?.porteur || '—',
      passouk: r.yom?.passouk || '—',
    },
    STE: {
      label:    r.STE?.label          || '—',
      dominant: r.STE?.dominant?.name || '—',
      count:    r.STE?.dominant?.count || 0,
      clarte:   r.STE?.clarity        || 0,
    },
    piliers: (r.piliers || []).map(p => ({
      num:       p.pilier?.num,
      name:      p.pilier?.name,
      heb:       p.pilier?.heb,
      formule:   p.calcul?.formule,
      sequence:  (p.sequence?.letters || []).map(l => l.n + '(' + l.mv + ')').join(' · '),
      direction: p.direction,
      emergence: p.emergence,
      loi:       p.pilier?.law,
      ayin:      p.ayin?.position || null,
      combs:     p.combNotes || [],
      str:       p.STR?.orientation || '',
    })),
    frequences: (r.frequences || []).slice(0, 5).map(f => f.name + '×' + f.count),
    tavnit:    r.tavnit ? (r.tavnit.tavnit + ' · ' + r.tavnit.loi) : null,
  };
}

// ── buildUserPrompt · Prompt LLM depuis CTRS ──────────────────
function buildUserPrompt(situation, ctrs) {
  const zman = ctrs.piliers.find(p => p.num === 7) || ctrs.piliers[6];
  return `SITUATION SOUMISE :
${situation}

RÉFÉRENTIEL TEMPOREL COMPUTATIONNEL (CTRS) · GAN HAI™ v2.3 :
Sha'at : ${ctrs.sha_at} · Valeur : ${ctrs.valeur}
Yom : ${ctrs.yom.shem} · Sceau : ${ctrs.yom.sceau}
Loi du Yom : ${ctrs.yom.loi}
Phrase : ${ctrs.yom.phrase}
Porteur : ${ctrs.yom.porteur}
Passouk : ${ctrs.yom.passouk}

STE™ : ${ctrs.STE.label} · Dominant : ${ctrs.STE.dominant} (${ctrs.STE.count}×)
Fréquences : ${ctrs.frequences.join(' · ')}
${ctrs.tavnit ? 'Tavnit : ' + ctrs.tavnit : ''}

7 PILIERS :
${ctrs.piliers.map(p =>
  `${p.num}·${p.name} (${p.heb}) · ${p.formule}
  Séquence : ${p.sequence}
  Direction : ${p.direction}
  Émergence : ${p.emergence}
  Loi : ${p.loi}
  ${p.combs.length ? 'Combinaisons : ' + p.combs.join(' · ') : ''}
  ${p.ayin ? 'Ayin ' + p.ayin : ''}
  STR : ${p.str}`
).join('\n\n')}

Lis cette situation depuis ce référentiel.
Commence par PARTIE 1 (données déterministes) puis PARTIE 2 (interprétation).`;
}

// ── callAnthropic ──────────────────────────────────────────────
function callAnthropic(situation, ctrs) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model:      MODEL,
      max_tokens: MAX_TOKENS,
      system:     SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserPrompt(situation, ctrs) }],
    });

    const options = {
      hostname: 'api.anthropic.com',
      path:     '/v1/messages',
      method:   'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length':    Buffer.byteLength(body),
      },
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.content && parsed.content[0]) {
            resolve(parsed.content[0].text);
          } else {
            reject(new Error('Reponse API inattendue : ' + data.slice(0, 200)));
          }
        } catch (e) { reject(e); }
      });
    });

    req.on('error', reject);
    // Timeout 55s (API Anthropic peut prendre jusqu'a 45s)
    req.setTimeout(55000, () => { req.destroy(); reject(new Error('Timeout LLM (55s)')); });
    req.write(body);
    req.end();
  });
}

// ── parseBody ──────────────────────────────────────────────────
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 100000) { req.destroy(); reject(new Error('Body trop large')); }
    });
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch (e) { reject(new Error('JSON invalide')); }
    });
  });
}

// ── CORS ───────────────────────────────────────────────────────
function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// ── Validation du body entrant ─────────────────────────────────
function validateBody(body, res) {
  if (!body.situation || typeof body.situation !== 'string') {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'situation manquante ou invalide' }));
    return false;
  }
  if (!body.referentiel || typeof body.referentiel !== 'object') {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'referentiel manquant' }));
    return false;
  }
  return true;
}

// ── SERVEUR ────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  setCORS(res);
  const parsed = url.parse(req.url, true);

  // Preflight CORS
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // ── GET /health ────────────────────────────────────────────
  if (req.method === 'GET' && parsed.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok', moteur: 'Gan Hai™ v2.3', version: '2.0',
      endpoints: ['POST /api/ctrs', 'POST /api/orientation', 'POST /interprete'],
    }));
    return;
  }

  // ── POST /api/ctrs · Moteur pur · aucun LLM ───────────────
  if (req.method === 'POST' && parsed.pathname === '/api/ctrs') {
    try {
      const body = await parseBody(req);
      if (!validateBody(body, res)) return;
      const ctrs = buildCTRS(body.referentiel);
      console.log(`[MOTEUR] ${ctrs.sha_at} · valeur:${ctrs.valeur} · sceau:${ctrs.yom.sceau} · STE:${ctrs.STE.label}`);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: true, ctrs }));
    } catch (err) {
      console.error('[MOTEUR] Erreur :', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: err.message }));
    }
    return;
  }

  // ── POST /api/orientation · CTRS → LLM → lecture structurée
  if (req.method === 'POST' && (parsed.pathname === '/api/orientation' || parsed.pathname === '/interprete')) {
    const isLegacy = parsed.pathname === '/interprete';
    try {
      const body = await parseBody(req);
      if (!validateBody(body, res)) return;

      const ctrs = buildCTRS(body.referentiel);
      console.log(`[MOTEUR] ${ctrs.sha_at} · valeur:${ctrs.valeur} · sceau:${ctrs.yom.sceau} · "${body.situation.slice(0,50)}"`);

      const lecture = await callAnthropic(body.situation, ctrs);
      console.log(`[LLM] modele:${MODEL} · chars_reponse:${lecture.length} · preview:"${lecture.slice(0,80)}"`);

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        ok:      true,
        lecture,
        sha_at:  ctrs.sha_at,
        valeur:  ctrs.valeur,
        sceau:   ctrs.yom.sceau,
        legacy:  isLegacy,
      }));

    } catch (err) {
      console.error('[LLM] Erreur :', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      // Retourner lecture:null pour que FL-366 bascule sur FL100_kaf proprement
      res.end(JSON.stringify({ ok: false, lecture: null, error: err.message }));
    }
    return;
  }

  // Route inconnue
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Route inconnue', endpoints: ['/health','/api/ctrs','/api/orientation','/interprete'] }));
});

server.listen(PORT, () => {
  console.log(`[GAN HAI™ v2.0] Port ${PORT}`);
  console.log(`[GAN HAI™] Modele : ${MODEL}`);
  console.log(`[GAN HAI™] /health · /api/ctrs · /api/orientation · /interprete (legacy)`);
  console.log(`[GAN HAI™] Principe d'or : le moteur calcule · le LLM traduit`);
});
