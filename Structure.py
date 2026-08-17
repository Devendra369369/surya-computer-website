import os

def show_structure(path="."):
    print("📂 CIMP\n")

    for root, dirs, files in os.walk(path):
        level = root.replace(path, "").count(os.sep)
        indent = "    " * level

        print(f"{indent}📁 {os.path.basename(root)}/")

        for file in files:
            print(f"{indent}    📄 {file}")


show_structure()