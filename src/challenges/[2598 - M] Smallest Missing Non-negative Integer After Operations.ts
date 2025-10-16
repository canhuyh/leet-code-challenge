// https://leetcode.com/problems/smallest-missing-non-negative-integer-after-operations
function findSmallestInteger(nums: number[], value: number): number {
  const data: number[] = new Array(value).fill(0);
  for (const num of nums) {
    const dataIdx = (num < 0 ? (num % value) + value : num) % value;
    data[dataIdx] += 1;
  }
  const min = Math.min(...data);
  const idx = data.indexOf(min);

  return min * value + idx;
}

console.log(findSmallestInteger([3, 0, 3, 2, 4, 2, 1, 1, 0, 4], 5));
