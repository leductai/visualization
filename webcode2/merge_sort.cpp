#include <iostream>
#include <vector>
using namespace std;

int n;
vector<int> a;

// Tron hai nua da sap xep a[left..mid] va a[mid+1..right].
void tron(int left, int mid, int right) {
    vector<int> tam;
    int i = left, j = mid + 1;
    while (i <= mid && j <= right) {
        if (a[i] <= a[j]) tam.push_back(a[i++]);
        else tam.push_back(a[j++]);
    }
    while (i <= mid) tam.push_back(a[i++]);
    while (j <= right) tam.push_back(a[j++]);
    for (int k = left; k <= right; k++) a[k] = tam[k - left];
}

// De quy: nua PHAI truoc roi moi nua trai (dung ma gia de thi).
void sapXep(int left, int right) {
    if (left < right) {
        int mid = (left + right) / 2;
        sapXep(mid + 1, right);
        sapXep(left, mid);
        tron(left, mid, right);
    }
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    cin >> n;
    a.resize(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    sapXep(0, n - 1);
    for (int i = 0; i < n; i++) {
        if (i > 0) cout << ' ';
        cout << a[i];
    }
    cout << '\n';
    return 0;
}
