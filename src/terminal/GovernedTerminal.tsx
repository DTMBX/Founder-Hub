/**
 * GovernedTerminal — Chain 5: Embedded Governed Terminal
 * 
 * xterm.js-based terminal UI with strict governance controls.
 * All commands validated against allowlist before execution.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

import type {
  GovernedTerminalProps,
  TerminalConfig,
  TerminalTheme,
  CommandResult,
  SiteContext,
} from './types';

import { getCommandExecutor } from './executor';
import { getRateLimiter, formatRateLimitMessage } from './rate-limiter';
import { getAllowedCommandDescriptions } from './allowlist';

// =============================================================================
// DEFAULT CONFIGURATION
// =============================================================================

const DEFAULT_THEME: TerminalTheme = {
  background: '#0a0a0a',
  foreground: '#e0e0e0',
  cursor: '#ffffff',
  cursorAccent: '#000000',
  selection: 'rgba(255, 255, 255, 0.2)',
  black: '#000000',
  red: '#e74c3c',
  green: '#2ecc71',
  yellow: '#f39c12',
  blue: '#3498db',
  magenta: '#9b59b6',
  cyan: '#1abc9c',
  white: '#ecf0f1',
  brightBlack: '#7f8c8d',
  brightRed: '#ff6b6b',
  brightGreen: '#5dff8a',
  brightYellow: '#ffd93d',
  brightBlue: '#74b9ff',
  brightMagenta: '#dda0dd',
  brightCyan: '#40e0d0',
  brightWhite: '#ffffff',
};

const DEFAULT_CONFIG: TerminalConfig = {
  theme: DEFAULT_THEME,
  fontSize: 14,
  fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
  cursorBlink: true,
  cursorStyle: 'block',
  scrollback: 1000,
};

// =============================================================================
// TERMINAL PROMPT
// =============================================================================

function getPrompt(site: SiteContext | null): string {
  if (site) {
    return `\x1b[36m${site.slug}\x1b[0m \x1b[90m$\x1b[0m `;
  }
  return '\x1b[33m(no site)\x1b[0m \x1b[90m$\x1b[0m ';
}

function getWelcomeMessage(): string {
  return `
\x1b[1;36m╔══════════════════════════════════════════════════════════╗
║               EVIDENT GOVERNED TERMINAL                   ║
║                                                            ║
║   Type 'help' to see available commands.                   ║
║   All commands are logged and monitored.                   ║
╚══════════════════════════════════════════════════════════╝\x1b[0m

`;
}

function getHelpText(): string {
  const commands = getAllowedCommandDescriptions();
  
  let help = '\x1b[1;33mAvailable Commands:\x1b[0m\n';
  help += '─'.repeat(50) + '\n';
  
  for (const cmd of commands) {
    help += `  \x1b[36m${cmd.command.padEnd(35)}\x1b[0m ${cmd.description}\n`;
  }
  
  help += '─'.repeat(50) + '\n';
  help += '\n\x1b[90mAll commands are validated against allowlist.\x1b[0m\n';
  help += '\x1b[90mShell commands and secrets access are blocked.\x1b[0m\n';
  
  return help;
}

// =============================================================================
// GOVERNED TERMINAL COMPONENT
// =============================================================================

export function GovernedTerminal({
  sessionId,
  userId,
  initialSite,
  config,
  rateLimitConfig,
  onCommand,
  onSiteChange,
  className = '',
}: GovernedTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstance = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);
  const currentLine = useRef<string>('');
  const historyRef = useRef<string[]>([]);
  const historyIndex = useRef<number>(-1);
  
  const [currentSite, setCurrentSite] = useState<SiteContext | null>(initialSite ?? null);
  const [isExecuting, setIsExecuting] = useState(false);
  
  // Merge config with defaults
  const mergedConfig: TerminalConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    theme: { ...DEFAULT_THEME, ...config?.theme },
  };
  
  // Initialize executor session
  const executor = getCommandExecutor();
  
  useEffect(() => {
    executor.createSession(sessionId, userId);
    
    return () => {
      executor.endSession(sessionId);
    };
  }, [sessionId, userId]);
  
  // Handle command execution
  const executeCommand = useCallback(async (command: string) => {
    if (!terminalInstance.current || isExecuting) return;
    
    const term = terminalInstance.current;
    const trimmed = command.trim();
    
    // Handle empty command
    if (!trimmed) {
      term.write('\r\n');
      term.write(getPrompt(currentSite));
      return;
    }
    
    // Handle built-in commands
    if (trimmed.toLowerCase() === 'help') {
      term.write('\r\n');
      term.write(getHelpText());
      term.write('\r\n');
      term.write(getPrompt(currentSite));
      return;
    }
    
    if (trimmed.toLowerCase() === 'clear') {
      term.clear();
      term.write(getPrompt(currentSite));
      return;
    }
    
    // Add to history
    if (trimmed) {
      historyRef.current = [...historyRef.current.filter(h => h !== trimmed), trimmed];
      historyIndex.current = -1;
    }
    
    // Check rate limit before execution
    const rateLimitCheck = getRateLimiter(rateLimitConfig).check(sessionId);
    if (!rateLimitCheck.allowed) {
      term.write('\r\n');
      term.write(`\x1b[31m${formatRateLimitMessage(rateLimitCheck)}\x1b[0m\r\n`);
      term.write(getPrompt(currentSite));
      return;
    }
    
    setIsExecuting(true);
    term.write('\r\n');
    
    try {
      const result: CommandResult = await executor.execute({
        sessionId,
        command: trimmed,
        timestamp: Date.now(),
      });
      
      // Display output
      if (result.blocked) {
        term.write(`\x1b[31m✗ ${result.redactedOutput}\x1b[0m\r\n`);
      } else {
        // Split output by lines and write each
        const lines = result.redactedOutput.split('\n');
        for (const line of lines) {
          term.write(line + '\r\n');
        }
      }
      
      // Check if site context changed
      const session = executor.getSession(sessionId);
      if (session?.currentSite !== currentSite) {
        setCurrentSite(session?.currentSite ?? null);
        onSiteChange?.(session?.currentSite ?? null);
      }
      
      // Callback
      onCommand?.(trimmed, result);
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      term.write(`\x1b[31mError: ${message}\x1b[0m\r\n`);
    }
    
    setIsExecuting(false);
    term.write(getPrompt(currentSite));
    
  }, [sessionId, currentSite, isExecuting, onCommand, onSiteChange, rateLimitConfig]);
  
  // Initialize terminal
  useEffect(() => {
    if (!terminalRef.current || terminalInstance.current) return;
    
    const term = new Terminal({
      theme: mergedConfig.theme,
      fontSize: mergedConfig.fontSize,
      fontFamily: mergedConfig.fontFamily,
      cursorBlink: mergedConfig.cursorBlink,
      cursorStyle: mergedConfig.cursorStyle,
      scrollback: mergedConfig.scrollback,
      convertEol: true,
      allowProposedApi: true,
    });
    
    const fit = new FitAddon();
    fitAddon.current = fit;
    term.loadAddon(fit);
    
    term.open(terminalRef.current);
    fit.fit();
    
    terminalInstance.current = term;
    
    // Write welcome message
    term.write(getWelcomeMessage());
    term.write(getPrompt(currentSite));
    
    // Handle input
    term.onData((data) => {
      if (isExecuting) return;
      
      const code = data.charCodeAt(0);
      
      // Enter
      if (code === 13) {
        executeCommand(currentLine.current);
        currentLine.current = '';
        return;
      }
      
      // Backspace
      if (code === 127) {
        if (currentLine.current.length > 0) {
          currentLine.current = currentLine.current.slice(0, -1);
          term.write('\b \b');
        }
        return;
      }
      
      // Ctrl+C
      if (code === 3) {
        term.write('^C\r\n');
        currentLine.current = '';
        term.write(getPrompt(currentSite));
        return;
      }
      
      // Ctrl+L (clear)
      if (code === 12) {
        term.clear();
        term.write(getPrompt(currentSite));
        term.write(currentLine.current);
        return;
      }
      
      // Arrow keys (escape sequences)
      if (data.startsWith('\x1b[')) {
        const seq = data.slice(2);
        
        // Up arrow - history
        if (seq === 'A') {
          if (historyRef.current.length > 0) {
            if (historyIndex.current < historyRef.current.length - 1) {
              historyIndex.current++;
              const historyEntry = historyRef.current[historyRef.current.length - 1 - historyIndex.current];
              
              // Clear current line
              term.write('\r' + getPrompt(currentSite) + ' '.repeat(currentLine.current.length));
              term.write('\r' + getPrompt(currentSite));
              
              currentLine.current = historyEntry;
              term.write(historyEntry);
            }
          }
          return;
        }
        
        // Down arrow - history
        if (seq === 'B') {
          if (historyIndex.current > 0) {
            historyIndex.current--;
            const historyEntry = historyRef.current[historyRef.current.length - 1 - historyIndex.current];
            
            // Clear current line
            term.write('\r' + getPrompt(currentSite) + ' '.repeat(currentLine.current.length));
            term.write('\r' + getPrompt(currentSite));
            
            currentLine.current = historyEntry;
            term.write(historyEntry);
          } else if (historyIndex.current === 0) {
            historyIndex.current = -1;
            
            // Clear current line
            term.write('\r' + getPrompt(currentSite) + ' '.repeat(currentLine.current.length));
            term.write('\r' + getPrompt(currentSite));
            
            currentLine.current = '';
          }
          return;
        }
        
        // Ignore other escape sequences
        return;
      }
      
      // Regular character - only allow printable ASCII
      if (code >= 32 && code < 127) {
        currentLine.current += data;
        term.write(data);
      }
    });
    
    // Handle resize
    const handleResize = () => {
      if (fitAddon.current) {
        fitAddon.current.fit();
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // ResizeObserver for container size changes
    const resizeObserver = new ResizeObserver(() => {
      if (fitAddon.current) {
        fitAddon.current.fit();
      }
    });
    
    resizeObserver.observe(terminalRef.current);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      term.dispose();
      terminalInstance.current = null;
    };
  }, [mergedConfig, executeCommand, currentSite, isExecuting]);
  
  // Update prompt when site changes
  useEffect(() => {
    // Site context handled inside executeCommand
  }, [currentSite]);
  
  return (
    <div 
      className={`governed-terminal ${className}`}
      style={{
        backgroundColor: mergedConfig.theme.background,
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Traffic lights */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ff5f56' }} />
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ffbd2e' }} />
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#27c93f' }} />
          </div>
          
          <span style={{ color: '#888', fontSize: '12px', marginLeft: '8px' }}>
            Governed Terminal
          </span>
        </div>
        
        {/* Status indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {currentSite && (
            <span style={{ color: '#1abc9c', fontSize: '12px' }}>
              📍 {currentSite.slug}
            </span>
          )}
          
          <span 
            style={{ 
              color: '#2ecc71', 
              fontSize: '11px',
              padding: '2px 6px',
              backgroundColor: 'rgba(46, 204, 113, 0.1)',
              borderRadius: '4px',
            }}
          >
            🔒 GOVERNED
          </span>
        </div>
      </div>
      
      {/* Terminal body */}
      <div
        ref={terminalRef}
        style={{
          padding: '8px',
          height: '400px',
          minHeight: '200px',
        }}
      />
      
      {/* Footer with session info */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 12px',
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          fontSize: '10px',
          color: '#666',
        }}
      >
        <span>Session: {sessionId.slice(0, 8)}...</span>
        <span>User: {userId}</span>
        <span>All commands logged</span>
      </div>
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export default GovernedTerminal;
