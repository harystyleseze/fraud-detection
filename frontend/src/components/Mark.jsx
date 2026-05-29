import markSvg from '../assets/veridian-mark.svg';

export function Mark({ size = 28 }) {
  return <img src={markSvg} width={size} height={size} alt="Veridian" style={{ display: 'block', flexShrink: 0 }} />;
}
