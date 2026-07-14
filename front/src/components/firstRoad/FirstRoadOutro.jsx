import React from "react";

const routeSteps = [
  ["01", "REQUEST", "&#50868;&#49569; &#51217;&#49688;"],
  ["02", "DISPATCH", "&#49892;&#49884;&#44036; &#48176;&#52264;"],
  ["03", "ROUTE", "&#44221;&#47196; &#52572;&#51201;&#54868;"],
  ["04", "ARRIVAL", "&#51221;&#54869;&#54620; &#46020;&#52265;"],
];

export default function FirstRoadOutro({ onConsult }) {
  return (
    <section id="first-road-outro" className="first-road-outro">
      <header className="first-road-outro-nav">
        <button type="button" onClick={onConsult}>
          &#50868;&#49569; &#49345;&#45812;
          <b aria-hidden="true">&#8599;</b>
        </button>
      </header>

      <div className="first-road-outro-hub">
        <div className="first-road-outro-heading">
          <p>FIRST ROAD · SMART LOGISTICS</p>
          <h2>&#45796;&#51020; &#50868;&#49569;&#46020;, &#44032;&#51109; &#47676;&#51200;.</h2>
          <span>
            &#51217;&#49688;&#48512;&#53552; &#46020;&#52265;&#44620;&#51648; First Road&#44032; &#54616;&#45208;&#51032; &#50868;&#49569; &#55120;&#47492;&#51004;&#47196; &#50672;&#44208;&#54633;&#45768;&#45796;.
          </span>
        </div>

        <div className="first-road-outro-route">
          {routeSteps.map(([number, label, title]) => (
            <article key={number}>
              <span>{number}</span>
              <small>{label}</small>
              <strong dangerouslySetInnerHTML={{ __html: title }} />
            </article>
          ))}
        </div>

        <div className="first-road-outro-actions">
          <a className="is-primary" href="/estimatepage">
            &#50868;&#49569; &#51217;&#49688; <b aria-hidden="true">&#8599;</b>
          </a>
          <a className="is-login" href="/login">
            &#47196;&#44536;&#51064; <b aria-hidden="true">&#8599;</b>
          </a>
          <a href="/guide">
            &#51060;&#50857; &#44032;&#51060;&#46300; <b aria-hidden="true">&#8599;</b>
          </a>
        </div>
      </div>
    </section>
  );
}
