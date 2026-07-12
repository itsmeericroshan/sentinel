"""
Emergency Response Orchestrator.
When compound risk is confirmed, auto-generates a regulatory-compliant
incident report PDF and returns it as base64 for download.
"""

from datetime import datetime
from dataclasses import dataclass
try:
    from fpdf import FPDF
    FPDF_AVAILABLE = True
except ImportError:
    FPDF_AVAILABLE = False


def generate_incident_report(
    zone_name: str,
    risk_score: float,
    readings: dict,
    rag_citations: list,
    tick: int,
) -> dict:
    """Generate a regulatory-compliant incident report."""

    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    report_id = f"INC-{datetime.now().strftime('%Y%m%d%H%M%S')}"

    # Determine severity
    if risk_score >= 0.85:
        severity = "CRITICAL"
    elif risk_score >= 0.65:
        severity = "HIGH"
    else:
        severity = "MEDIUM"

    # Identify contributing factors
    factors = []
    if readings.get("gas", 0) > 60:
        factors.append(f"Elevated gas pressure: {readings['gas']:.0f}/100")
    if readings.get("vent", 100) < 50:
        factors.append(f"Degraded ventilation: {readings['vent']:.0f}/100")
    if readings.get("permit", 0):
        factors.append("Active hot-work permit in high-risk zone")
    if readings.get("maint", 0):
        factors.append("Maintenance activity in progress")
    if readings.get("prox", 0) > 50:
        factors.append(f"High worker proximity: {readings['prox']:.0f}/100")

    # Recommended actions
    actions = []
    if readings.get("permit", 0):
        actions.append("IMMEDIATE: Revoke all hot-work permits in affected zone")
    if readings.get("gas", 0) > 60:
        actions.append("IMMEDIATE: Activate emergency ventilation systems")
    if readings.get("prox", 0) > 50:
        actions.append("IMMEDIATE: Evacuate workers from affected zone")
    actions.append("URGENT: Notify shift supervisor and safety officer")
    actions.append("URGENT: Preserve all sensor logs for investigation")
    actions.append("REQUIRED: File incident report with DGFASLI within 24 hours")
    actions.append("REQUIRED: Review permit-to-work procedures per Factory Act")

    report_data = {
        "report_id": report_id,
        "timestamp": timestamp,
        "zone": zone_name,
        "severity": severity,
        "risk_score": round(risk_score * 100, 1),
        "tick": tick,
        "factors": factors,
        "actions": actions,
        "citations": rag_citations,
    }

    if not FPDF_AVAILABLE:
        return {"report": report_data, "pdf_available": False}

    # Generate PDF
    pdf = FPDF()
    pdf.add_page()

    # Header
    pdf.set_fill_color(26, 26, 26)
    pdf.rect(0, 0, 210, 35, 'F')
    pdf.set_font("Helvetica", "B", 22)
    pdf.set_text_color(204, 0, 0)
    pdf.cell(0, 12, "SENTINEL", ln=True, align="C")
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(200, 200, 200)
    pdf.cell(0, 6, "AI-Powered Industrial Safety Intelligence", ln=True, align="C")
    pdf.cell(0, 6, "Emergency Incident Report", ln=True, align="C")
    pdf.ln(10)

    # Report ID and timestamp
    pdf.set_text_color(26, 26, 26)
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(0, 8, f"Report ID: {report_id}", ln=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 6, f"Generated: {timestamp}", ln=True)
    pdf.cell(0, 6, f"Zone: {zone_name}", ln=True)

    # Severity badge
    if severity == "CRITICAL":
        pdf.set_fill_color(204, 0, 0)
    elif severity == "HIGH":
        pdf.set_fill_color(217, 119, 6)
    else:
        pdf.set_fill_color(202, 138, 4)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Helvetica", "B", 12)
    pdf.ln(3)
    pdf.cell(50, 10, f"  {severity}", fill=True, ln=True)
    pdf.set_text_color(26, 26, 26)
    pdf.ln(3)

    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(0, 8, f"Causal Risk Score: {risk_score*100:.1f}%", ln=True)
    pdf.ln(3)

    # Contributing factors
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_fill_color(240, 240, 240)
    pdf.cell(0, 8, "Contributing Factors (Causal Analysis)", fill=True, ln=True)
    pdf.set_font("Helvetica", "", 10)
    for f in factors:
        pdf.cell(8, 7, "", ln=False)
        pdf.cell(0, 7, f"• {f}", ln=True)
    pdf.ln(3)

    # Sensor readings
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_fill_color(240, 240, 240)
    pdf.cell(0, 8, "Sensor Readings at Time of Alert", fill=True, ln=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 7, f"  Gas / Atmospheric Pressure: {readings.get('gas', 0):.0f}/100", ln=True)
    pdf.cell(0, 7, f"  Ventilation Health: {readings.get('vent', 0):.0f}/100", ln=True)
    pdf.cell(0, 7, f"  Hot-work Permit Active: {'YES' if readings.get('permit') else 'No'}", ln=True)
    pdf.cell(0, 7, f"  Maintenance Activity: {'YES' if readings.get('maint') else 'No'}", ln=True)
    pdf.cell(0, 7, f"  Worker Proximity: {readings.get('prox', 0):.0f}/100", ln=True)
    pdf.ln(3)

    # Recommended actions
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_fill_color(240, 240, 240)
    pdf.cell(0, 8, "Recommended Actions", fill=True, ln=True)
    pdf.set_font("Helvetica", "", 10)
    for a in actions:
        pdf.cell(8, 7, "", ln=False)
        pdf.multi_cell(0, 7, f"• {a}")
    pdf.ln(3)

    # Regulatory citations
    if rag_citations:
        pdf.set_font("Helvetica", "B", 11)
        pdf.set_fill_color(240, 240, 240)
        pdf.cell(0, 8, "Regulatory Grounding", fill=True, ln=True)
        pdf.set_font("Helvetica", "", 9)
        for c in rag_citations:
            pdf.set_font("Helvetica", "B", 9)
            pdf.cell(0, 6, f"[{c.get('type', 'reference').upper()}]", ln=True)
            pdf.set_font("Helvetica", "", 9)
            pdf.multi_cell(0, 6, c.get("text", ""))
            pdf.ln(2)

    # Footer
    pdf.ln(5)
    pdf.set_font("Helvetica", "I", 8)
    pdf.set_text_color(150, 150, 150)
    pdf.multi_cell(0, 5,
        "This report was auto-generated by SENTINEL AI Safety Intelligence. "
        "It must be reviewed by a qualified safety officer before submission to regulatory authorities. "
        "Generated under simulated conditions for prototype demonstration.")

    import base64
    import io
    pdf_bytes = pdf.output()
    pdf_b64 = base64.b64encode(bytes(pdf_bytes)).decode("utf-8")

    return {
        "report": report_data,
        "pdf_available": True,
        "pdf_base64": pdf_b64,
        "filename": f"{report_id}.pdf"
    }
