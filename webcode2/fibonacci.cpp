#include <iostream>
using namespace std;

// Chia de tri top-down: fibo(n) = fibo(n-1) + fibo(n-2).
long long fibo(int n) {
    if (n <= 1) return n;
    return fibo(n - 1) + fibo(n - 2);
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    cout << fibo(n) << '\n';
    return 0;
}
