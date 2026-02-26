import React from "react";

export default function HeaderBar({ title, subtitle }) {
  return (
    <div className="headerWrap">
      <div className="headerHero">
        <button className="backBtn" aria-label="Back">←</button>

        <div className="headerCopy">
          <div className="titleRow">
            <span className="titleIcon">⚕</span>
            <span className="title">{title}</span>
          </div>
          <div className="subtitle">{subtitle}</div>
        </div>
      </div>

      <div className="headerTop">
        <div className="searchWrap">
          <span className="searchIcon">⌕</span>
          <input className="searchInput" placeholder="Search patients..." />
        </div>

        <div className="topActions">
          <button className="iconBtn" aria-label="Filter">⌁</button>
          <select className="statusSelect" defaultValue="all" aria-label="Filter status">
            <option value="all">All Status</option>
            <option value="normal">Normal</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>
    </div>
  );
}
