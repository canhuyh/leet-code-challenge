// https://leetcode.com/problems/adjacent-increasing-subarrays-detection-i

function hasIncreasingSubarrays(nums: number[], k: number): boolean {
  const n = nums.length;
  if (n < 2 * k) return false;

  const increasingLength = new Array(n).fill(1);
  for (let i = 1; i < n; i++) {
    if (nums[i] > nums[i - 1]) {
      increasingLength[i] = increasingLength[i - 1] + 1;
    }
  }

  for (let i = k - 1; i < n - k; i++) {
    if (increasingLength[i] >= k && increasingLength[i + k] >= k) {
      return true;
    }
  }

  return false;
}

console.log(hasIncreasingSubarrays([2, 5, 7, 8, 9, 2, 3, 4, 3, 1], 3));
