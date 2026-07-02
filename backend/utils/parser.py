import fitz  # PyMuPDF
import re
import os

def parse_pdf(file_path: str) -> dict:
    """
    Parses a PDF file and extracts core sections: Title, Abstract, Introduction, 
    Methodology, Results/Experiments, and References.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"PDF file not found: {file_path}")
        
    doc = fitz.open(file_path)
    full_text = ""
    pages_text = []
    
    for page in doc:
        text = page.get_text()
        pages_text.append(text)
        full_text += text + "\n"
        
    # Attempt to extract sections based on common headings
    sections = {
        "title": "",
        "abstract": "",
        "introduction": "",
        "methodology": "",
        "results": "",
        "conclusion": "",
        "references": ""
    }
    
    # Simple extraction of Title (usually from the first page, top lines)
    if pages_text:
        first_page_lines = [line.strip() for line in pages_text[0].split("\n") if line.strip()]
        if first_page_lines:
            # Pick first non-empty line as title candidate
            sections["title"] = first_page_lines[0]
            
    # Normalize headers for regex matching
    # We look for typical section headers in IEEE formats
    header_patterns = {
        "abstract": re.compile(r'\b(?:abstract|i\.\s+abstract|i\.\s+introduction)\b', re.IGNORECASE),
        "introduction": re.compile(r'\b(?:introduction|ii\.\s+introduction|ii\.\s+related\s+work)\b', re.IGNORECASE),
        "methodology": re.compile(r'\b(?:methodology|proposed\s+method|proposed\s+system|architecture|system\s+model|methods)\b', re.IGNORECASE),
        "results": re.compile(r'\b(?:results|experiments|evaluation|experimental\s+results|performance|discussion)\b', re.IGNORECASE),
        "conclusion": re.compile(r'\b(?:conclusion|conclusions|conclusions\s+and\s+future\s+work)\b', re.IGNORECASE),
        "references": re.compile(r'\b(?:references|bibliography)\b', re.IGNORECASE)
    }
    
    # We find indices of these section headers in full_text
    matches = []
    for section_name, pattern in header_patterns.items():
        for m in pattern.finditer(full_text):
            matches.append((m.start(), section_name, m.group()))
            
    # Sort matches by character index
    matches.sort(key=lambda x: x[0])
    
    # If we found matches, segment the text
    if matches:
        for i in range(len(matches)):
            start_idx, section_name, matched_text = matches[i]
            end_idx = matches[i+1][0] if i + 1 < len(matches) else len(full_text)
            
            # Extract content between headers
            content = full_text[start_idx + len(matched_text):end_idx].strip()
            # Clean up content (remove excessive spaces, newlines, etc.)
            content = re.sub(r'\s+', ' ', content)
            
            sections[section_name] = content
    else:
        # Fallback if no structured sections found
        sections["abstract"] = full_text[:2000]
        sections["methodology"] = full_text[2000:6000]
        sections["results"] = full_text[6000:10000]
        sections["references"] = full_text[10000:]
        
    # If sections are empty but fallback text exists, double check
    if not sections["abstract"] and len(full_text) > 0:
        sections["abstract"] = full_text[:1500]
        
    return {
        "filename": os.path.basename(file_path),
        "title": sections["title"] or os.path.basename(file_path).replace(".pdf", ""),
        "abstract": sections["abstract"][:3000] if sections["abstract"] else "Not found.",
        "introduction": sections["introduction"][:4000] if sections["introduction"] else "Not found.",
        "methodology": sections["methodology"][:6000] if sections["methodology"] else "Not found.",
        "results": sections["results"][:4000] if sections["results"] else "Not found.",
        "conclusion": sections["conclusion"][:2000] if sections["conclusion"] else "Not found.",
        "references": sections["references"][:3000] if sections["references"] else "Not found."
    }
