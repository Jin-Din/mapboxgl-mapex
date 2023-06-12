/**
 *  替换字符串中 以中括号 ${...} 结构的内容
 * @param template
 * @param templateValues
 * @returns
 */
export const templateParser = (template: string, templateValues: Record<string, any>) => {
  if (!templateValues) return template;

  let reg = /\$\{(.*?)\}/g;
  let realUrl = template.replace(reg, (item, key) => {
    if (Object.keys(templateValues!).includes(key)) return templateValues![key];
    else return item;
  });

  return realUrl;
};
