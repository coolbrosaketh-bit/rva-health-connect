/**
 * "Help me choose" — a two-question guided flow for people who don't know
 * what to search for. It only sets real filters; nothing here is decorative.
 */
import { CATEGORIES } from '../data/taxonomy.js';
import { esc, pluralize } from '../lib/format.js';
import { icon } from './icons.js';

const INSURANCE = [
  { value: 'uninsured', label: 'I don’t have insurance', hint: 'Show places that serve people without insurance' },
  { value: 'medicaid', label: 'I have Medicaid or FAMIS', hint: 'Show places that accept Medicaid' },
  { value: 'private', label: 'I have private insurance', hint: 'Show places that accept private plans' },
  { value: 'any', label: 'I’m not sure', hint: 'Show everything' },
];

export function createGuide(dialog, { countFor, onApply }) {
  let step = 1;
  let answers = { need: null, insurance: null };

  function tips() {
    const out = [];
    if (answers.need === 'mental') out.push('In a crisis right now? Call or text 988, any time.');
    if (answers.need === 'dental') out.push('In tooth pain? VCU School of Dentistry offers a walk-in evaluation for new patients with pain or infection.');
    if (answers.insurance === 'uninsured') out.push('You may qualify for Medicaid at no cost. The income limits are in the “Get coverage” section.');
    if (answers.need === 'none' || answers.insurance === 'any') out.push('211 can talk through your situation and suggest places, 24 hours a day.');
    out.push('Call before you go. Most clinics ask new patients to register first.');
    return out;
  }

  function render() {
    const need = answers.need;
    if (step === 1) {
      dialog.innerHTML = `
        <form class="guide__inner" data-guide-form>
          <div class="guide__top">
            <p class="guide__progress">Question 1 of 2</p>
            <button class="icon-btn" type="button" data-close aria-label="Close">${icon('x')}</button>
          </div>
          <fieldset>
            <legend id="guide-title">What kind of help are you looking for?</legend>
            <div class="options options--2">
              ${CATEGORIES.map((c) => `
                <div class="option" style="--c:${c.color}">
                  <input type="radio" name="need" id="need-${c.id}" value="${c.id}" ${need === c.id ? 'checked' : ''}>
                  <label for="need-${c.id}">${icon(c.icon, { size: 22 })}<span>${esc(c.label)}<small>${esc(c.blurb)}</small></span></label>
                </div>`).join('')}
              <div class="option">
                <input type="radio" name="need" id="need-none" value="none" ${need === 'none' ? 'checked' : ''}>
                <label for="need-none">${icon('circle-help', { size: 22 })}<span>Something else, or I’m not sure<small>See every kind of help</small></span></label>
              </div>
            </div>
          </fieldset>
          <div class="guide__nav">
            <span></span>
            <button class="btn btn--primary btn--lg" type="submit">Next</button>
          </div>
        </form>`;
    } else if (step === 2) {
      dialog.innerHTML = `
        <form class="guide__inner" data-guide-form>
          <div class="guide__top">
            <p class="guide__progress">Question 2 of 2</p>
            <button class="icon-btn" type="button" data-close aria-label="Close">${icon('x')}</button>
          </div>
          <fieldset>
            <legend id="guide-title">Do you have health insurance?</legend>
            <p class="guide__hint">This only filters the list. Nothing you choose is saved or sent anywhere.</p>
            <div class="options">
              ${INSURANCE.map((o) => `
                <div class="option">
                  <input type="radio" name="insurance" id="ins-${o.value}" value="${o.value}" ${answers.insurance === o.value ? 'checked' : ''}>
                  <label for="ins-${o.value}">${icon(o.value === 'any' ? 'circle-help' : 'shield-check', { size: 22 })}<span>${esc(o.label)}<small>${esc(o.hint)}</small></span></label>
                </div>`).join('')}
            </div>
          </fieldset>
          <div class="guide__nav">
            <button class="btn" type="button" data-back>${icon('arrow-left', { size: 18 })}Back</button>
            <button class="btn btn--primary btn--lg" type="submit">See results</button>
          </div>
        </form>`;
    } else {
      const filters = toFilters();
      const n = countFor(filters);
      dialog.innerHTML = `
        <div class="guide__inner guide__result">
          <div class="guide__top">
            <p class="guide__progress">Your results</p>
            <button class="icon-btn" type="button" data-close aria-label="Close">${icon('x')}</button>
          </div>
          <h2 id="guide-title">${n ? `${pluralize(n, 'place')} may fit.` : 'Nothing in this list fits exactly.'}</h2>
          <ul>${tips().map((t) => `<li>${icon('check', { size: 20 })}<span>${esc(t)}</span></li>`).join('')}</ul>
          <div class="guide__nav">
            <button class="btn" type="button" data-back>${icon('arrow-left', { size: 18 })}Change answers</button>
            ${n
              ? `<button class="btn btn--primary btn--lg" type="button" data-apply>Show ${pluralize(n, 'place')}</button>`
              : `<a class="btn btn--primary btn--lg" href="tel:211">${icon('phone', { size: 18 })}Dial 211</a>`}
          </div>
        </div>`;
    }
    const first = dialog.querySelector('input:checked, input, [data-apply], h2');
    if (first) {
      if (first.tagName === 'H2') first.setAttribute('tabindex', '-1');
      first.focus();
    }
  }

  function toFilters() {
    return {
      categories: new Set(answers.need && answers.need !== 'none' ? [answers.need] : []),
      insurance: answers.insurance || 'any',
    };
  }

  dialog.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target;
    if (step === 1) {
      const v = form.elements.need?.value;
      if (!v) return flagRequired(form);
      answers.need = v;
      step = 2;
    } else if (step === 2) {
      const v = form.elements.insurance?.value;
      if (!v) return flagRequired(form);
      answers.insurance = v;
      step = 3;
    }
    render();
  });

  function flagRequired(form) {
    let msg = form.querySelector('.guide__error');
    if (!msg) {
      msg = document.createElement('p');
      msg.className = 'guide__hint guide__error';
      msg.setAttribute('role', 'alert');
      form.querySelector('fieldset').append(msg);
    }
    msg.textContent = 'Choose one option to continue.';
    form.querySelector('input')?.focus();
  }

  dialog.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) dialog.close();
    else if (e.target.closest('[data-back]')) { step = Math.max(1, step - 1); render(); }
    else if (e.target.closest('[data-apply]')) { dialog.close(); onApply(toFilters()); }
    else if (e.target === dialog) dialog.close(); // backdrop click
  });

  return {
    open() {
      step = 1;
      answers = { need: null, insurance: null };
      render();
      dialog.showModal();
      render(); // re-focus now that the dialog is open
    },
  };
}
