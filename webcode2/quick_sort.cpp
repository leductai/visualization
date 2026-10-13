#include <iostream>
#include <vector>
#include <utility>
using namespace std;

int n;
vector<int> a;

// Phan doan Lomuto: chot = a[right], gom so <= chot ve dau.
int phanDoan(int left, int right) {
    int chot = a[right];
    int i = left - 1;
    for (int j = left; j < right; j++) {
        if (a[j] <= chot) {
            i++;
            swap(a[i], a[j]);
        }
    }
    swap(a[i + 1], a[right]);
    return i + 1;
}

void sapXepNhanh(int left, int right) {
    if (left < right) {
        int chotViTri = phanDoan(left, right);
        sapXepNhanh(left, chotViTri - 1);
        sapXepNhanh(chotViTri + 1, right);
    }
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    cin >> n;
    a.resize(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    sapXepNhanh(0, n - 1);
    for (int i = 0; i < n; i++) {
        if (i > 0) cout << ' ';
        cout << a[i];
    }
    cout << '\n';
    return 0;
}
