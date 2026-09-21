import { useState, useEffect, useRef } from 'react';
import { Copy, Check } from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-sql';

export function CodeBlock({ inline, className, children }) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef(null);

  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const codeString = String(children).replace(/\n$/, '');

  useEffect(() => {
    if (codeRef.current && language && Prism.languages[language]) {
      Prism.highlightElement(codeRef.current);
    }
  }, [codeString, language]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code: ', err);
    }
  };

  if (inline) {
    return <code>{children}</code>;
  }

  return (
    <div className="code-block-wrapper">
      <div className="code-block-header">
        <span>{language || 'code'}</span>
        <button
          className="code-copy-btn"
          onClick={handleCopy}
          aria-label="Copy code to clipboard"
          type="button"
        >
          {copied ? (
            <>
              <Check size={14} color="#10a37f" />
              <span style={{ color: '#10a37f' }}>Copied!</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>
      <pre className="code-block-pre">
        <code ref={codeRef} className={language ? `language-${language}` : ''}>
          {codeString}
        </code>
      </pre>
    </div>
  );
}
