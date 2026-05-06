import ast

def analyze_code(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
      code=f.read()

    tree=ast.parse(code)

    result={
    "functions":[],
    "classes":[]
    }

    for node in ast.walk(tree):
       if isinstance(node, ast.FunctionDef):
           result["functions"].append({
            "name":node.name,
            "line":node.lineno,
            "args":[arg.arg for arg in node.args.args]
           })
       if isinstance(node, ast.ClassDef):
           result["classes"].append({
            "name":node.name,
            "line":node.lineno,
            "args":[arg.arg for arg in node.args.args]
           })
    return result


def extract_function_code(file_path):
   with open(file_path,"r", encoding="utf-8") as f:
      lines=f.readlines()

      tree=ast.parse("".join(lines))

      functions=[]

      for node in tree.body:
         if isinstance(node,ast.FunctionDef):
            start=node.lineno -1
            end=node.end_lineno

            code="".join(lines[start:end])

            functions.append({
               "name":node.name,
               "code":code
            })
      return functions