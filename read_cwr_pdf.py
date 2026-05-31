import pdfplumber

pdf_path = r"C:\Users\Usuário\Downloads\B-5-BO - LAYOUT CWR - README - (PORTUGES) - V1.0.PDF"

with pdfplumber.open(pdf_path) as pdf:
    print(f"Total paginas: {len(pdf.pages)}\n")
    for i in range(min(8, len(pdf.pages))):
        text = pdf.pages[i].extract_text()
        print(f"=== PAGINA {i+1} ===")
        print(text)
        print()
