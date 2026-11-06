import React, { useState, useEffect, useMemo } from "react";
import {
  ChallengeData,
  createFriendChallenge,
  generateChallengeShareLink,
  generateChallengeShareText,
  copyToClipboard
} from "./friendChallenge.js";

interface EntityOption {
  id: number;
  name: string;
  description: string | null;
}

interface ChallengeCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayChallenge: (code: string, domain: "character" | "object", creatorName: string) => void;
}

export function ChallengeCreatorModal({
  isOpen,
  onClose,
  onPlayChallenge
}: ChallengeCreatorModalProps) {
  const [domain, setDomain] = useState<"character" | "object">("object");
  const [entities, setEntities] = useState<EntityOption[]>([]);
  const [loadingEntities, setLoadingEntities] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedEntity, setSelectedEntity] = useState<EntityOption | null>(null);
  const [creatorName, setCreatorName] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("cognitor_creator_name") || "";
    }
    return "";
  });
  const [createdChallenge, setCreatedChallenge] = useState<ChallengeData | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedCard, setCopiedCard] = useState<boolean>(false);

  // Load active entities for the selected domain
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    const fetchEntities = async () => {
      setLoadingEntities(true);
      setErrorMsg("");
      setSelectedEntity(null);
      try {
        const res = await fetch(`/api/reverse/entities?domain=${domain}`);
        if (res.ok && isMounted) {
          const list: EntityOption[] = await res.json();
          setEntities(list);
        }
      } catch {
        if (isMounted) setErrorMsg("Failed to load items list.");
      } finally {
        if (isMounted) setLoadingEntities(false);
      }
    };
    fetchEntities();
    return () => {
      isMounted = false;
    };
  }, [domain, isOpen]);

  // Filtered entities matching search
  const filteredEntities = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return entities.slice(0, 20);
    return entities.filter((e) => e.name.toLowerCase().includes(q)).slice(0, 25);
  }, [entities, searchQuery]);

  const handleCreate = async () => {
    if (!selectedEntity || submitting) return;
    setSubmitting(true);
    setErrorMsg("");

    try {
      const name = creatorName.trim() || "A Friend";
      if (typeof window !== "undefined") {
        localStorage.setItem("cognitor_creator_name", name);
      }
      const result = await createFriendChallenge(domain, selectedEntity.id, name);
      setCreatedChallenge(result);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create challenge.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyLink = async () => {
    if (!createdChallenge) return;
    const link = generateChallengeShareLink(createdChallenge.code);
    const ok = await copyToClipboard(link);
    if (ok) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleCopyCard = async () => {
    if (!createdChallenge) return;
    const text = generateChallengeShareText(
      createdChallenge.code,
      createdChallenge.creatorName,
      createdChallenge.domain
    );
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedCard(true);
      setTimeout(() => setCopiedCard(false), 2500);
    }
  };

  const resetModal = () => {
    setCreatedChallenge(null);
    setSelectedEntity(null);
    setSearchQuery("");
    setErrorMsg("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="reversal-modal-backdrop" onClick={resetModal}>
      <div className="reversal-modal-card challenge-creator-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-row">
          <div>
            <span className="reversal-eyebrow">Social Mode</span>
            <h3 className="modal-title">Challenge a Friend</h3>
          </div>
          <button className="modal-close-btn" onClick={resetModal} type="button">
            Close
          </button>
        </div>

        {errorMsg && <div className="guess-feedback-banner">{errorMsg}</div>}

        {!createdChallenge ? (
          <>
            <p className="modal-instruction">
              Pick any secret character or object from the database. We will generate a private link for your friend to guess it against Cognitor!
            </p>

            {/* Domain Selector */}
            <div className="challenge-domain-toggle">
              <button
                className={`challenge-domain-btn ${domain === "object" ? "domain-btn-active" : ""}`}
                onClick={() => setDomain("object")}
                type="button"
              >
                Objects Mode
              </button>
              <button
                className={`challenge-domain-btn ${domain === "character" ? "domain-btn-active" : ""}`}
                onClick={() => setDomain("character")}
                type="button"
              >
                Characters Mode
              </button>
            </div>

            {/* Creator Name Input */}
            <div className="challenge-form-group">
              <label className="challenge-form-label">Your Name or Nickname</label>
              <input
                type="text"
                className="guess-text-input"
                placeholder="e.g. Alex, Gokul..."
                value={creatorName}
                onChange={(e) => setCreatorName(e.target.value)}
                maxLength={30}
              />
            </div>

            {/* Secret Entity Picker */}
            <div className="challenge-form-group">
              <label className="challenge-form-label">
                Choose Secret {domain === "character" ? "Character" : "Object"}
              </label>
              <div className="reversal-search-bar challenge-search-bar">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                  type="text"
                  className="reversal-search-input"
                  placeholder={`Search ${domain}s (e.g. ${domain === "object" ? "Guitar, Apple, Cricket Ball" : "Einstein, Messi, Batman"})...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {loadingEntities ? (
                <div className="reversal-loading-state">Loading options...</div>
              ) : (
                <div className="challenge-picker-list">
                  {filteredEntities.map((item) => (
                    <button
                      key={item.id}
                      className={`challenge-picker-item ${selectedEntity?.id === item.id ? "picker-item-selected" : ""}`}
                      onClick={() => setSelectedEntity(item)}
                      type="button"
                    >
                      <div className="picker-item-info">
                        <span className="picker-item-name">{item.name}</span>
                        {item.description && (
                          <span className="picker-item-desc">{item.description}</span>
                        )}
                      </div>
                      {selectedEntity?.id === item.id && (
                        <span className="picker-item-check">Selected</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedEntity && (
              <div className="challenge-selected-preview">
                <span className="selected-preview-label">Your Secret Target:</span>
                <span className="selected-preview-val">{selectedEntity.name}</span>
              </div>
            )}

            <div className="modal-actions-row">
              <button className="btn btn-secondary" onClick={resetModal} type="button">
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreate}
                disabled={!selectedEntity || submitting}
                type="button"
              >
                {submitting ? "Generating Link..." : "Create Challenge Link"}
              </button>
            </div>
          </>
        ) : (
          /* ============================================================ */
          /* CHALLENGE CREATED SUCCESS VIEW */
          /* ============================================================ */
          <div className="challenge-success-view">
            <div className="challenge-code-showcase">
              <span className="showcase-eyebrow">Challenge Ready</span>
              <h2 className="showcase-code">{createdChallenge.code}</h2>
              <p className="showcase-desc">
                Your friend will try to guess your secret {createdChallenge.domain} in under 20 questions!
              </p>
            </div>

            <div className="challenge-link-box">
              <input
                type="text"
                readOnly
                value={generateChallengeShareLink(createdChallenge.code)}
                className="challenge-link-input"
              />
            </div>

            <div className="challenge-success-actions">
              <button className="btn btn-primary" onClick={handleCopyLink} type="button">
                {copiedLink ? "Link Copied to Clipboard!" : "Copy Share Link"}
              </button>
              <button className="btn btn-secondary" onClick={handleCopyCard} type="button">
                {copiedCard ? "Challenge Card Copied!" : "Copy Full Message"}
              </button>
            </div>

            <div className="challenge-self-test-row">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  onPlayChallenge(
                    createdChallenge.code,
                    createdChallenge.domain,
                    createdChallenge.creatorName
                  );
                  resetModal();
                }}
                type="button"
              >
                Test Play Your Own Challenge
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
