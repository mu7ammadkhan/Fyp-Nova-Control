import { paths } from "../../routes/paths";
import "./Chatbot.css";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FiCommand, FiX, FiArrowUp, FiMic, FiSquare, FiArrowUpRight, FiZap, FiCheck, FiAlertCircle } from "react-icons/fi";
import { parseCommand } from "../../utils/commandParser";

export default function Chatbot({ devices = [], uid }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const input = useRef(null);
  const launcher = useRef(null);
  const conversation = useRef(null);
  const recognition = useRef(null);
  const sendingRef = useRef(false);
  const sequence = useRef(0);
  const first = devices[0];
  const suggestions = first ? [`${first.name} on`, `${first.name} off`, ...(devices.some((device) => device.type?.toLowerCase() === "light") ? ["All lights off"] : [])] : [];
  const close = () => { recognition.current?.abort(); setOpen(false); launcher.current?.focus(); };

  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const escape = (event) => { if (event.key === "Escape") { recognition.current?.abort(); setOpen(false); launcher.current?.focus(); } };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [open]);
  useEffect(() => { if (conversation.current) conversation.current.scrollTop = conversation.current.scrollHeight; }, [messages, open]);
  useEffect(() => () => { recognition.current?.abort(); }, []);

  const send = async (value = text) => {
    const command = value.trim();
    if (!command || sendingRef.current) return;
    sendingRef.current = true; setSending(true); setText(""); setVoiceError("");
    const id = ++sequence.current;
    setMessages((current) => [...current.slice(-18), {id, command, status:"pending", reply:"Sending your command..."}]);
    try {
      const reply = await parseCommand(command, devices, uid);
      setMessages((current) => current.map((message) => message.id === id ? {...message, reply, status:"success"} : message));
    } catch (error) {
      setMessages((current) => current.map((message) => message.id === id ? {...message, reply:error.message || "Unable to send the command. Please try again.", status:"error"} : message));
    } finally {
      sendingRef.current = false; setSending(false); input.current?.focus();
    }
  };
  const voice = () => {
    if (listening) { recognition.current?.stop(); return; }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { setVoiceError("Voice input isn’t supported in this browser. You can type your command below."); return; }
    setVoiceError("");
    try {
      const session = new SpeechRecognition(); recognition.current = session;
      session.lang = "en-PK"; session.interimResults = false; session.maxAlternatives = 1;
      session.onstart = () => setListening(true);
      session.onend = () => { setListening(false); recognition.current = null; };
      session.onresult = (event) => { const spoken = event.results?.[0]?.[0]?.transcript || ""; if (spoken.trim()) send(spoken); };
      session.onerror = (event) => {
        if (event.error !== "aborted") setVoiceError(event.error === "not-allowed" ? "Microphone access was denied. Allow it in your browser, or type a command." : "I couldn’t hear a command. Please try again or type below.");
      };
      session.start();
    } catch { setListening(false); setVoiceError("Unable to start voice input. Please type your command."); }
  };
  return <div className="nova-assistant">
    {open && <section id="nova-assistant-panel" className="nova-panel" role="dialog" aria-modal="false" aria-labelledby="nova-assistant-title">
      <header className="nova-header"><span className="nova-mark"><FiCommand /></span><div><h2 id="nova-assistant-title">Nova Assistant</h2><p>Home control, made simple.</p></div><button className="nova-icon-button" onClick={close} aria-label="Close assistant"><FiX /></button></header>
      <div className="nova-context"><span><FiZap /> Device commands</span><span>{devices.length} available</span></div>
      <div ref={conversation} className="nova-conversation"><div className="nova-welcome"><span className="nova-welcome-icon"><FiCommand /></span><h3>A little help with your home.</h3><p>Control your devices with a simple command. Type it below, or use your voice.</p></div>
        {suggestions.length ? <div className="nova-suggestions"><span>TRY A COMMAND</span>{suggestions.map((suggestion) => <button key={suggestion} disabled={sending || listening} onClick={() => {setText(suggestion);input.current?.focus();}}><span>{suggestion}</span><FiArrowUpRight /></button>)}</div> : <div className="nova-empty"><p>Add your first device to start using home commands.</p><Link to={paths.rooms} onClick={close}>Explore rooms <FiArrowUpRight /></Link></div>}
        <div className="nova-messages" role="log" aria-live="polite" aria-relevant="additions text">{messages.map((message) => <div className="nova-exchange" key={message.id}><p className="nova-user-message">{message.command}</p><div className={`nova-reply nova-reply-${message.status}`}>{message.status === "pending" ? <span className="nova-typing" aria-hidden="true"><i /><i /><i /></span> : message.status === "error" ? <FiAlertCircle /> : <FiCheck />}<p>{message.reply}</p></div></div>)}</div>
      </div>
      <footer className="nova-composer"><div className="nova-input-status" role="status">{voiceError || (listening ? "Listening... Say a device name and ON or OFF." : sending ? "Sending your command..." : "Use a device name followed by ON or OFF.")}</div><form onSubmit={(event) => {event.preventDefault();send();}}><input ref={input} value={text} onChange={(event) => setText(event.target.value)} aria-label="Device command" placeholder={first ? `e.g. ${first.name} on` : "Add a device to get started"} maxLength={240} autoComplete="off" disabled={sending || listening} /><button type="button" className={`nova-mic ${listening ? "is-listening" : ""}`} onClick={voice} disabled={sending || !devices.length} aria-label={listening ? "Stop listening" : "Use voice command"} aria-pressed={listening}>{listening ? <FiSquare /> : <FiMic />}</button><button className="nova-send" disabled={!text.trim() || sending || listening || !devices.length} aria-label="Send command"><FiArrowUp /></button></form><p className="nova-disclaimer">Commands update saved device states.</p></footer>
    </section>}
    <button ref={launcher} className={`nova-launcher ${open ? "is-open" : ""}`} onClick={() => open ? close() : setOpen(true)} aria-label={open ? "Close Nova Assistant" : "Open Nova Assistant"} aria-expanded={open} aria-controls="nova-assistant-panel"><span>{open ? <FiX /> : <FiCommand />}</span><span className="nova-launcher-label">Nova Assistant</span></button>
  </div>;
}
